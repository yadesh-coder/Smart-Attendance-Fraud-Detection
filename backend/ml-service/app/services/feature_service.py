import uuid
from datetime import datetime, timezone
from app.database import fetch_one, fetch_all, execute_insert_or_update

from app.services.anomaly_service import AnomalyService

def encode_signal_status(status_str: str | None) -> int | None:
    if not status_str or status_str.upper() in ["NOT_AVAILABLE", "UNAVAILABLE", "PENDING"]:
        return None
    s = status_str.upper()
    if s in ["QR_VALID", "FACE_MATCH", "DEVICE_VALID", "DEVICE_RECOGNIZED", "LOCATION_VALID", "VERIFIED", "VALID"]:
        return 1
    if s in ["QR_INVALID", "FACE_MISMATCH", "NO_FACE_DETECTED", "MULTIPLE_FACES", "NOT_ENROLLED", "DEVICE_MISMATCH", "NEW_DEVICE", "OUT_OF_BOUNDS", "LOCATION_SPOOFED", "FAILED", "INVALID"]:
        return 0
    return None

class FeatureService:

    @staticmethod
    def generate_features_for_attempt(attempt_id: str) -> dict:
        # 1. Fetch verification attempt from attendance_db.attendance_verification_attempts
        attempt = fetch_one(
            "attendance_db",
            "SELECT * FROM attendance_verification_attempts WHERE attempt_id = %s",
            (attempt_id,)
        )
        if not attempt:
            raise ValueError(f"Verification attempt not found: {attempt_id}")

        student_user_id = attempt["student_user_id"]
        session_id = attempt["session_id"]
        created_at = attempt.get("created_at") or datetime.now(timezone.utc)

        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))

        # Timezone check for future timestamps
        now_utc = datetime.now(timezone.utc)
        created_at_utc = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
        if (created_at_utc - now_utc).total_seconds() > 300:
            raise ValueError("Invalid timestamp: Timestamp is in the future")

        # 2. Check Idempotency: Existing v1 feature record for this attempt
        existing_feat = fetch_one(
            "attendance_ml_db",
            "SELECT * FROM ml_attendance_features WHERE attempt_id = %s AND feature_version = 'v1'",
            (attempt_id,)
        )
        feature_id = existing_feat["feature_id"] if existing_feat else f"FEAT_{uuid.uuid4().hex[:12].upper()}"

        # 3. Fetch session details from attendance_db.attendance_sessions
        session = fetch_one(
            "attendance_db",
            "SELECT * FROM attendance_sessions WHERE session_id = %s",
            (session_id,)
        )
        subject_id = session["subject_id"] if session else "UNKNOWN_SUBJECT"

        # 4. Fetch location details from attendance_location_db.location_verification_attempts
        loc_rec = fetch_one(
            "attendance_location_db",
            "SELECT * FROM location_verification_attempts WHERE attempt_id = %s",
            (attempt_id,)
        )
        if not loc_rec:
            loc_rec = fetch_one(
                "attendance_location_db",
                "SELECT * FROM location_verification_attempts WHERE session_id = %s AND student_user_id = %s ORDER BY id DESC LIMIT 1",
                (session_id, student_user_id)
            )

        loc_dist = None  # distance_meters not present in location_verification_attempts schema
        loc_acc = None
        if loc_rec:
            loc_acc = loc_rec.get("accuracy")
            if loc_acc is not None and loc_acc < 0:
                raise ValueError("Negative location accuracy is invalid")

        # 5. Device signal is derived from the verification attempt
        device_status = attempt.get("device_status")
        if not device_status or device_status.upper() in ["NOT_AVAILABLE", "UNAVAILABLE", "PENDING"]:
            device_known = None
            device_change_indicator = None
        elif device_status.upper() == "DEVICE_RECOGNIZED":
            device_known = 1
            device_change_indicator = 0
        elif device_status.upper() in ["NEW_DEVICE", "DEVICE_MISMATCH", "NOT_ENROLLED"]:
            device_known = 0
            device_change_indicator = 1
        else:
            device_known = None
            device_change_indicator = None

        # 6. Fetch fraud assessment from attendance_fraud_db.fraud_assessments
        fraud_ass = fetch_one(
            "attendance_fraud_db",
            "SELECT * FROM fraud_assessments WHERE attempt_id = %s",
            (attempt_id,)
        )
        if not fraud_ass:
            fraud_ass = fetch_one(
                "attendance_fraud_db",
                "SELECT * FROM fraud_assessments WHERE session_id = %s AND student_user_id = %s ORDER BY id DESC LIMIT 1",
                (session_id, student_user_id)
            )

        fraud_rule_count = 0
        deterministic_risk_level = "LOW"
        deterministic_decision = "PENDING"
        if fraud_ass:
            deterministic_risk_level = fraud_ass.get("risk_level", "LOW")
            deterministic_decision = fraud_ass.get("decision", "PENDING")
            assessment_id = fraud_ass.get("assessment_id")
            rules = fetch_all(
                "attendance_fraud_db",
                "SELECT COUNT(*) as count FROM triggered_rules WHERE assessment_id = %s",
                (assessment_id,)
            )
            if rules and len(rules) > 0:
                fraud_rule_count = rules[0]["count"]

        # 7. Signal Encodings (Ternary: 1=VALID, 0=INVALID, NULL=UNAVAILABLE)
        qr_valid = encode_signal_status(attempt.get("qr_status"))
        face_valid = encode_signal_status(attempt.get("face_status"))
        device_valid = encode_signal_status(attempt.get("device_status"))
        location_valid = encode_signal_status(attempt.get("location_status"))

        # 8. Temporal Features
        attendance_hour = created_at.hour
        attendance_day_of_week = created_at.isoweekday()  # 1=Mon, 7=Sun

        # 9. Historical Aggregates
        session_count_res = fetch_one(
            "attendance_db",
            "SELECT COUNT(*) as count FROM attendance_sessions WHERE subject_id = %s",
            (subject_id,)
        )
        student_session_count = session_count_res["count"] if session_count_res else 0

        subject_att_res = fetch_one(
            "attendance_db",
            "SELECT COUNT(*) as count FROM attendance_records r JOIN attendance_sessions s ON r.session_id = s.session_id WHERE r.student_user_id = %s AND s.subject_id = %s AND r.attendance_status = 'PRESENT'",
            (student_user_id, subject_id)
        )
        student_subject_attendance_count = subject_att_res["count"] if subject_att_res else 0

        recent_att_res = fetch_one(
            "attendance_db",
            "SELECT COUNT(*) as count FROM attendance_records WHERE student_user_id = %s AND marked_at >= NOW() - INTERVAL 7 DAY AND attendance_status = 'PRESENT'",
            (student_user_id,)
        )
        student_recent_attendance_count = recent_att_res["count"] if recent_att_res else 0

        # Time since previous attendance
        prev_att = fetch_one(
            "attendance_db",
            "SELECT marked_at FROM attendance_records WHERE student_user_id = %s AND marked_at < %s ORDER BY marked_at DESC LIMIT 1",
            (student_user_id, created_at)
        )
        time_since_previous_attendance = None
        if prev_att and prev_att.get("marked_at"):
            prev_ts = prev_att["marked_at"]
            if isinstance(prev_ts, str):
                prev_ts = datetime.fromisoformat(prev_ts.replace("Z", "+00:00"))
            time_since_previous_attendance = int((created_at - prev_ts).total_seconds() / 60)

        # Time since previous session
        prev_sess = fetch_one(
            "attendance_db",
            "SELECT created_at FROM attendance_sessions WHERE subject_id = %s AND created_at < %s ORDER BY created_at DESC LIMIT 1",
            (subject_id, created_at)
        )
        time_since_previous_session = None
        if prev_sess and prev_sess.get("created_at"):
            ps_ts = prev_sess["created_at"]
            if isinstance(ps_ts, str):
                ps_ts = datetime.fromisoformat(ps_ts.replace("Z", "+00:00"))
            time_since_previous_session = int((created_at - ps_ts).total_seconds() / 60)

        feature_record = {
            "feature_id": feature_id,
            "attempt_id": attempt_id,
            "session_id": session_id,
            "student_user_id": student_user_id,
            "subject_id": subject_id,
            "feature_version": "v1",
            "timestamp": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
            "qr_valid": qr_valid,
            "face_valid": face_valid,
            "device_valid": device_valid,
            "location_valid": location_valid,
            "location_distance_meters": loc_dist,
            "location_accuracy_meters": loc_acc,
            "device_known": device_known,
            "device_change_indicator": device_change_indicator,
            "attendance_hour": attendance_hour,
            "attendance_day_of_week": attendance_day_of_week,
            "student_session_count": student_session_count,
            "student_subject_attendance_count": student_subject_attendance_count,
            "student_recent_attendance_count": student_recent_attendance_count,
            "time_since_previous_attendance": time_since_previous_attendance,
            "time_since_previous_session": time_since_previous_session,
            "fraud_rule_count": fraud_rule_count,
            "deterministic_risk_level": deterministic_risk_level,
            "deterministic_decision": deterministic_decision,
            "anomaly_score": None,
            "anomaly_label": None
        }

        # 9.5 Run Real ML Anomaly Inference via AnomalyService
        ml_res = AnomalyService.predict(feature_record)
        feature_record["anomaly_score"] = ml_res.get("anomaly_score")
        feature_record["anomaly_label"] = ml_res.get("anomaly_label")

        # 10. Persist to attendance_ml_db.ml_attendance_features (Idempotent ON DUPLICATE KEY UPDATE)
        insert_sql = """
        INSERT INTO ml_attendance_features (
            feature_id, attempt_id, session_id, student_user_id, subject_id, feature_version, timestamp,
            qr_valid, face_valid, device_valid, location_valid,
            location_distance_meters, location_accuracy_meters,
            device_known, device_change_indicator,
            attendance_hour, attendance_day_of_week,
            student_session_count, student_subject_attendance_count, student_recent_attendance_count,
            time_since_previous_attendance, time_since_previous_session,
            fraud_rule_count, deterministic_risk_level, deterministic_decision,
            anomaly_score, anomaly_label
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s, %s,
            %s, %s,
            %s, %s, %s,
            %s, %s
        ) ON DUPLICATE KEY UPDATE
            qr_valid=VALUES(qr_valid), face_valid=VALUES(face_valid), device_valid=VALUES(device_valid), location_valid=VALUES(location_valid),
            location_distance_meters=VALUES(location_distance_meters), location_accuracy_meters=VALUES(location_accuracy_meters),
            device_known=VALUES(device_known), device_change_indicator=VALUES(device_change_indicator),
            fraud_rule_count=VALUES(fraud_rule_count), deterministic_risk_level=VALUES(deterministic_risk_level), deterministic_decision=VALUES(deterministic_decision),
            anomaly_score=VALUES(anomaly_score), anomaly_label=VALUES(anomaly_label);
        """
        params = (
            feature_record["feature_id"], feature_record["attempt_id"], feature_record["session_id"],
            feature_record["student_user_id"], feature_record["subject_id"], feature_record["feature_version"],
            created_at,
            feature_record["qr_valid"], feature_record["face_valid"], feature_record["device_valid"], feature_record["location_valid"],
            feature_record["location_distance_meters"], feature_record["location_accuracy_meters"],
            feature_record["device_known"], feature_record["device_change_indicator"],
            feature_record["attendance_hour"], feature_record["attendance_day_of_week"],
            feature_record["student_session_count"], feature_record["student_subject_attendance_count"], feature_record["student_recent_attendance_count"],
            feature_record["time_since_previous_attendance"], feature_record["time_since_previous_session"],
            feature_record["fraud_rule_count"], feature_record["deterministic_risk_level"], feature_record["deterministic_decision"],
            feature_record["anomaly_score"], feature_record["anomaly_label"]
        )
        execute_insert_or_update("attendance_ml_db", insert_sql, params)

        return feature_record

    @staticmethod
    def get_features_by_attempt(attempt_id: str) -> dict | None:
        rec = fetch_one(
            "attendance_ml_db",
            "SELECT * FROM ml_attendance_features WHERE attempt_id = %s",
            (attempt_id,)
        )
        if rec and isinstance(rec.get("timestamp"), datetime):
            rec["timestamp"] = rec["timestamp"].isoformat()
        if rec and isinstance(rec.get("created_at"), datetime):
            rec["created_at"] = rec["created_at"].isoformat()
        return rec
