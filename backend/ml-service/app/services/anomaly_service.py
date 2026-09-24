import os
import joblib
import numpy as np

RISK_LEVEL_MAP = {
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2,
    "CRITICAL": 3
}

FEATURE_COLUMNS = [
    "qr_valid",
    "face_valid",
    "device_valid",
    "location_valid",
    "device_known",
    "device_change_indicator",
    "attendance_hour",
    "attendance_day_of_week",
    "fraud_rule_count",
    "deterministic_risk_level_encoded"
]

class AnomalyService:
    _artifact = None
    _model = None
    _is_loaded = False

    @classmethod
    def get_model_path(cls) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        return os.path.join(base_dir, "models", "isolation_forest_model.joblib")

    @classmethod
    def load_model(cls) -> bool:
        model_path = cls.get_model_path()
        if not os.path.exists(model_path):
            cls._model = None
            cls._artifact = None
            cls._is_loaded = False
            return False
        try:
            artifact = joblib.load(model_path)
            cls._artifact = artifact
            cls._model = artifact.get("model")
            cls._is_loaded = cls._model is not None
            return cls._is_loaded
        except Exception as e:
            print(f"Error loading IsolationForest model from {model_path}: {e}")
            cls._model = None
            cls._artifact = None
            cls._is_loaded = False
            return False

    @classmethod
    def is_loaded(cls) -> bool:
        if not cls._is_loaded:
            return cls.load_model()
        return True

    @classmethod
    def extract_feature_vector(cls, feat_dict: dict) -> list[float]:
        def val_or_neg1(v):
            if v is None:
                return -1.0
            try:
                return float(v)
            except (ValueError, TypeError):
                return -1.0

        qr_v = val_or_neg1(feat_dict.get("qr_valid"))
        face_v = val_or_neg1(feat_dict.get("face_valid"))
        device_v = val_or_neg1(feat_dict.get("device_valid"))
        loc_v = val_or_neg1(feat_dict.get("location_valid"))
        dev_known = val_or_neg1(feat_dict.get("device_known"))
        dev_change = val_or_neg1(feat_dict.get("device_change_indicator"))

        att_hour = val_or_neg1(feat_dict.get("attendance_hour"))
        if att_hour < 0:
            att_hour = 12.0

        att_dow = val_or_neg1(feat_dict.get("attendance_day_of_week"))
        if att_dow < 0:
            att_dow = 1.0

        rule_cnt = val_or_neg1(feat_dict.get("fraud_rule_count"))
        if rule_cnt < 0:
            rule_cnt = 0.0

        risk_str = str(feat_dict.get("deterministic_risk_level", "LOW")).upper()
        risk_enc = float(RISK_LEVEL_MAP.get(risk_str, 0))

        return [
            qr_v,
            face_v,
            device_v,
            loc_v,
            dev_known,
            dev_change,
            att_hour,
            att_dow,
            rule_cnt,
            risk_enc
        ]

    @classmethod
    def predict(cls, feat_dict: dict) -> dict:
        if not cls.is_loaded():
            return {
                "anomaly_score": None,
                "anomaly_label": None,
                "model_status": "NOT_FOUND"
            }

        vec = cls.extract_feature_vector(feat_dict)
        X = np.array([vec])

        try:
            raw_score = float(cls._model.decision_function(X)[0])
            pred_label = int(cls._model.predict(X)[0])

            # In IsolationForest:
            # decision_function > 0 indicates normal/inlier
            # decision_function <= 0 indicates anomaly/outlier (or predict == -1)
            anomaly_label = "ANOMALOUS" if (pred_label == -1 or raw_score < 0) else "NORMAL"

            # Standardize score rounded to 4 decimal places
            anomaly_score = round(raw_score, 4)

            return {
                "anomaly_score": anomaly_score,
                "anomaly_label": anomaly_label,
                "model_status": "LOADED"
            }
        except Exception as e:
            print(f"Error during ML inference: {e}")
            return {
                "anomaly_score": None,
                "anomaly_label": None,
                "model_status": "ERROR"
            }
