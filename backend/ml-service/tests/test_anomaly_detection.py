import pytest
from app.services.anomaly_service import AnomalyService

# Setup: ensure model is loaded before running tests
@pytest.fixture(autouse=True)
def setup_model():
    AnomalyService.load_model()

# Scenario 1: Normal Attendance
def test_normal_attendance_inference():
    feat = {
        "qr_valid": 1,
        "face_valid": 1,
        "device_valid": 1,
        "location_valid": 1,
        "device_known": 1,
        "device_change_indicator": 0,
        "attendance_hour": 10,
        "attendance_day_of_week": 2,
        "fraud_rule_count": 0,
        "deterministic_risk_level": "LOW"
    }
    res = AnomalyService.predict(feat)
    assert res["model_status"] == "LOADED"
    assert isinstance(res["anomaly_score"], float)
    assert res["anomaly_label"] == "NORMAL"

# Scenario 2: Face Mismatch
def test_face_mismatch_inference():
    feat = {
        "qr_valid": 1,
        "face_valid": 0,
        "device_valid": 1,
        "location_valid": 1,
        "device_known": 1,
        "device_change_indicator": 0,
        "attendance_hour": 10,
        "attendance_day_of_week": 2,
        "fraud_rule_count": 1,
        "deterministic_risk_level": "CRITICAL"
    }
    res = AnomalyService.predict(feat)
    assert res["model_status"] == "LOADED"
    assert isinstance(res["anomaly_score"], float)
    assert res["anomaly_label"] in ["NORMAL", "ANOMALOUS"]

# Scenario 3: Invalid QR Code
def test_invalid_qr_inference():
    feat = {
        "qr_valid": 0,
        "face_valid": 1,
        "device_valid": 1,
        "location_valid": 1,
        "device_known": 1,
        "device_change_indicator": 0,
        "attendance_hour": 10,
        "attendance_day_of_week": 2,
        "fraud_rule_count": 1,
        "deterministic_risk_level": "CRITICAL"
    }
    res = AnomalyService.predict(feat)
    assert res["model_status"] == "LOADED"
    assert isinstance(res["anomaly_score"], float)
    assert res["anomaly_label"] in ["NORMAL", "ANOMALOUS"]

# Scenario 4: Device Mismatch
def test_device_mismatch_inference():
    feat = {
        "qr_valid": 1,
        "face_valid": 1,
        "device_valid": 0,
        "location_valid": 1,
        "device_known": 0,
        "device_change_indicator": 1,
        "attendance_hour": 10,
        "attendance_day_of_week": 2,
        "fraud_rule_count": 1,
        "deterministic_risk_level": "CRITICAL"
    }
    res = AnomalyService.predict(feat)
    assert res["model_status"] == "LOADED"
    assert isinstance(res["anomaly_score"], float)
    assert res["anomaly_label"] in ["NORMAL", "ANOMALOUS"]

# Scenario 5: Location Out of Bounds
def test_location_out_of_bounds_inference():
    feat = {
        "qr_valid": 1,
        "face_valid": 1,
        "device_valid": 1,
        "location_valid": 0,
        "device_known": 1,
        "device_change_indicator": 0,
        "attendance_hour": 10,
        "attendance_day_of_week": 2,
        "fraud_rule_count": 1,
        "deterministic_risk_level": "CRITICAL"
    }
    res = AnomalyService.predict(feat)
    assert res["model_status"] == "LOADED"
    assert isinstance(res["anomaly_score"], float)

# Scenario 6: Multiple Simultaneous Suspicious Signals
def test_multiple_suspicious_signals_inference():
    feat = {
        "qr_valid": 0,
        "face_valid": 0,
        "device_valid": 0,
        "location_valid": 0,
        "device_known": 0,
        "device_change_indicator": 1,
        "attendance_hour": 3,
        "attendance_day_of_week": 7,
        "fraud_rule_count": 4,
        "deterministic_risk_level": "CRITICAL"
    }
    res = AnomalyService.predict(feat)
    assert res["model_status"] == "LOADED"
    assert isinstance(res["anomaly_score"], float)
    assert res["anomaly_label"] == "ANOMALOUS"

# Scenario 7: Missing / Incomplete Feature Input
def test_missing_feature_input_inference():
    feat = {
        "qr_valid": 1,
        "face_valid": None,
        "device_valid": None,
        "location_valid": None,
        "device_known": None,
        "device_change_indicator": None,
        "attendance_hour": None,
        "attendance_day_of_week": None,
        "fraud_rule_count": 0,
        "deterministic_risk_level": "LOW"
    }
    res = AnomalyService.predict(feat)
    assert res["model_status"] == "LOADED"
    assert isinstance(res["anomaly_score"], float)
    assert res["anomaly_label"] in ["NORMAL", "ANOMALOUS"]

# Scenario 8: Model Unavailable / Error Handling Fallback
def test_model_unavailable_fallback(mocker):
    mocker.patch.object(AnomalyService, "is_loaded", return_value=False)
    res = AnomalyService.predict({"qr_valid": 1})
    assert res["model_status"] == "NOT_FOUND"
    assert res["anomaly_score"] is None
    assert res["anomaly_label"] is None
