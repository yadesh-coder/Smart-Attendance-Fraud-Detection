import pytest
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.services.feature_service import encode_signal_status, FeatureService

client = TestClient(app)

def create_test_token(user_id: int, email: str, role: str = "ROLE_STUDENT") -> str:
    payload = {
        "sub": email,
        "userId": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

# Test 1: Signal Encoding for VALID
def test1_valid_signal_encoding():
    assert encode_signal_status("QR_VALID") == 1
    assert encode_signal_status("FACE_MATCH") == 1
    assert encode_signal_status("DEVICE_RECOGNIZED") == 1
    assert encode_signal_status("LOCATION_VALID") == 1

# Test 2: Signal Encoding for INVALID
def test2_invalid_signal_encoding():
    assert encode_signal_status("FACE_MISMATCH") == 0
    assert encode_signal_status("DEVICE_MISMATCH") == 0
    assert encode_signal_status("OUT_OF_BOUNDS") == 0
    assert encode_signal_status("NEW_DEVICE") == 0

# Test 3: Signal Encoding for UNAVAILABLE -> NULL
def test3_unavailable_signal_encoding():
    assert encode_signal_status("NOT_AVAILABLE") is None
    assert encode_signal_status("UNAVAILABLE") is None
    assert encode_signal_status("PENDING") is None
    assert encode_signal_status(None) is None

# Test 4: Missing Attempt Rejection
def test4_missing_attempt_rejection(mocker):
    mocker.patch("app.services.feature_service.fetch_one", return_value=None)
    with pytest.raises(ValueError, match="Verification attempt not found"):
        FeatureService.generate_features_for_attempt("NON_EXISTENT_ATTEMPT")

# Test 5: Negative Location Accuracy Rejection
def test5_negative_location_accuracy_rejection(mocker):
    now = datetime.now(timezone.utc)
    mocker.patch("app.services.feature_service.fetch_one", side_effect=[
        {"student_user_id": 10, "session_id": "SESS1", "created_at": now}, # attempt
        None, # existing feat
        {"subject_id": "SUBJ1"}, # session
        {"accuracy": -5.0} # location
    ])
    with pytest.raises(ValueError, match="Negative location accuracy is invalid"):
        FeatureService.generate_features_for_attempt("ATTEMPT_NEG_ACC")

# Test 6: Invalid Future Timestamp Rejection
def test6_invalid_future_timestamp_rejection(mocker):
    future_time = datetime.now(timezone.utc) + timedelta(days=2)
    mocker.patch("app.services.feature_service.fetch_one", return_value={
        "student_user_id": 10, "session_id": "SESS1", "created_at": future_time
    })
    with pytest.raises(ValueError, match="Invalid timestamp"):
        FeatureService.generate_features_for_attempt("ATTEMPT_FUTURE")

# Test 7: Feature Version is 'v1' and Anomaly Score/Label are NULL
def test7_feature_version_and_anomaly_inference(mocker):
    now = datetime.now(timezone.utc)
    mocker.patch("app.services.feature_service.fetch_one", side_effect=[
        {"student_user_id": 10, "session_id": "SESS1", "created_at": now, "qr_status": "QR_VALID", "face_status": "NOT_AVAILABLE", "device_status": "DEVICE_RECOGNIZED", "location_status": "LOCATION_VALID"}, # attempt
        None, # existing feat
        {"subject_id": "SUBJ1"}, # session
        {"accuracy": 10.0}, # location
        {"risk_level": "LOW", "decision": "SAFE", "assessment_id": "ASS1"}, # fraud
        {"count": 5},
        {"count": 3},
        {"count": 2},
        None,
        None
    ])
    mocker.patch("app.services.feature_service.fetch_all", return_value=[{"count": 0}])
    mocker.patch("app.services.feature_service.execute_insert_or_update", return_value=1)

    feat = FeatureService.generate_features_for_attempt("ATTEMPT_OK")

    assert feat["feature_version"] == "v1"
    assert isinstance(feat["anomaly_score"], float)
    assert feat["anomaly_label"] in ["NORMAL", "ANOMALOUS"]
    assert feat["qr_valid"] == 1
    assert feat["face_valid"] is None  # NOT_AVAILABLE -> NULL
    assert feat["device_valid"] == 1
    assert feat["location_valid"] == 1

# Test 8: Student Ownership Isolation (Student A accessing Student B -> 403 Forbidden)
def test8_student_isolation_forbidden(mocker):
    mocker.patch("app.routes.features.FeatureService.get_features_by_attempt", return_value={
        "feature_id": "FEAT_123",
        "attempt_id": "ATTEMPT_B",
        "student_user_id": 99
    })

    token_stu_a = create_test_token(user_id=10, email="studentA@college.edu", role="ROLE_STUDENT")
    headers = {"Authorization": f"Bearer {token_stu_a}"}

    response = client.get("/api/ml/features/attempt/ATTEMPT_B", headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

# Test 9: Privacy Protection Check (No sensitive fields returned)
def test9_privacy_protection_no_sensitive_leakage(mocker):
    now_str = datetime.now(timezone.utc).isoformat()
    mocker.patch("app.routes.features.FeatureService.get_features_by_attempt", return_value={
        "feature_id": "FEAT_123",
        "attempt_id": "ATTEMPT_A",
        "session_id": "SESS1",
        "student_user_id": 10,
        "subject_id": "SUBJ1",
        "feature_version": "v1",
        "timestamp": now_str,
        "qr_valid": 1,
        "face_valid": 1,
        "device_valid": 1,
        "location_valid": 1,
        "location_distance_meters": None,
        "location_accuracy_meters": 10.0,
        "device_known": 1,
        "device_change_indicator": 0,
        "attendance_hour": 9,
        "attendance_day_of_week": 1,
        "student_session_count": 5,
        "student_subject_attendance_count": 4,
        "student_recent_attendance_count": 3,
        "time_since_previous_attendance": 120,
        "time_since_previous_session": 1440,
        "fraud_rule_count": 0,
        "deterministic_risk_level": "LOW",
        "deterministic_decision": "SAFE",
        "anomaly_score": None,
        "anomaly_label": None
    })

    token_stu_a = create_test_token(user_id=10, email="studentA@college.edu", role="ROLE_STUDENT")
    headers = {"Authorization": f"Bearer {token_stu_a}"}

    response = client.get("/api/ml/features/attempt/ATTEMPT_A", headers=headers)
    assert response.status_code == 200
    res_str = response.text
    assert "password" not in res_str
    assert "secret" not in res_str
    assert "embedding" not in res_str
    assert "latitude" not in res_str
    assert "longitude" not in res_str
    assert "fingerprint" not in res_str

# Test 10: Authorization Pre-Check in Generate Endpoint
def test10_authorization_pre_check(mocker):
    mocker.patch("app.routes.features.fetch_one", return_value={"student_user_id": 99})

    token_stu_a = create_test_token(user_id=10, email="studentA@college.edu", role="ROLE_STUDENT")
    headers = {"Authorization": f"Bearer {token_stu_a}"}

    response = client.post("/api/ml/features/generate", json={"attemptId": "ATTEMPT_OTHER_STUDENT"}, headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]
