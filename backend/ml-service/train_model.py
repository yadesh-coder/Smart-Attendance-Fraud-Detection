import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

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

RISK_LEVEL_MAP = {
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2,
    "CRITICAL": 3
}

def generate_synthetic_dataset(num_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    num_normal = int(num_samples * 0.90)
    num_anomalous = num_samples - num_normal

    # Normal Attendance Patterns (90%)
    normal_data = {
        "qr_valid": np.random.choice([1, 1, 1, 1], size=num_normal),
        "face_valid": np.random.choice([1, 1, 1, -1], size=num_normal),  # 75% valid, 25% missing
        "device_valid": np.random.choice([1, 1, 1, -1], size=num_normal),
        "location_valid": np.random.choice([1, 1, 1, -1], size=num_normal),
        "device_known": np.random.choice([1, 1, -1], size=num_normal),
        "device_change_indicator": np.random.choice([0, 0, -1], size=num_normal),
        "attendance_hour": np.random.randint(8, 18, size=num_normal),  # 8 AM to 5 PM
        "attendance_day_of_week": np.random.randint(1, 6, size=num_normal),  # Mon - Fri
        "fraud_rule_count": np.zeros(num_normal, dtype=int),
        "deterministic_risk_level_encoded": np.zeros(num_normal, dtype=int)  # LOW = 0
    }

    # Anomalous / Suspicious Attendance Patterns (10%)
    anomalous_data = {
        "qr_valid": np.random.choice([0, 1], size=num_anomalous, p=[0.4, 0.6]),
        "face_valid": np.random.choice([0, 1, -1], size=num_anomalous, p=[0.5, 0.3, 0.2]),
        "device_valid": np.random.choice([0, 1, -1], size=num_anomalous, p=[0.5, 0.3, 0.2]),
        "location_valid": np.random.choice([0, 1, -1], size=num_anomalous, p=[0.5, 0.3, 0.2]),
        "device_known": np.random.choice([0, 1, -1], size=num_anomalous, p=[0.6, 0.2, 0.2]),
        "device_change_indicator": np.random.choice([1, 0, -1], size=num_anomalous, p=[0.6, 0.2, 0.2]),
        "attendance_hour": np.random.choice([0, 1, 2, 3, 22, 23, 9, 10], size=num_anomalous),
        "attendance_day_of_week": np.random.choice([1, 2, 3, 4, 5, 6, 7], size=num_anomalous),
        "fraud_rule_count": np.random.randint(1, 5, size=num_anomalous),
        "deterministic_risk_level_encoded": np.random.choice([1, 2, 3], size=num_anomalous, p=[0.2, 0.4, 0.4])
    }

    df_normal = pd.DataFrame(normal_data)
    df_anomalous = pd.DataFrame(anomalous_data)

    df_full = pd.concat([df_normal, df_anomalous], ignore_index=True)

    # Shuffle dataset deterministically
    df_full = df_full.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df_full

def train_and_save_model():
    print("=== TRAINING ISOLATION FOREST ANOMALY DETECTION MODEL ===")

    # 1. Generate Synthetic Training Data
    df = generate_synthetic_dataset(num_samples=5000, seed=42)
    print(f"Generated Synthetic Training Dataset: {len(df)} samples ({len(FEATURE_COLUMNS)} features)")

    X = df[FEATURE_COLUMNS].values

    # 2. Train IsolationForest
    model = IsolationForest(
        n_estimators=100,
        contamination=0.10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X)

    # 3. Model Performance Diagnostics
    predictions = model.predict(X)
    scores = model.decision_function(X)

    num_inliers = np.sum(predictions == 1)
    num_outliers = np.sum(predictions == -1)

    print(f"Model Training Complete:")
    print(f"  - Inliers (Normal):     {num_inliers} ({num_inliers/len(df)*100:.1f}%)")
    print(f"  - Outliers (Anomalous): {num_outliers} ({num_outliers/len(df)*100:.1f}%)")
    print(f"  - Score Range:          min={scores.min():.4f}, max={scores.max():.4f}, mean={scores.mean():.4f}")

    # 4. Save Model Artifact to models/
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "isolation_forest_model.joblib")

    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "risk_level_map": RISK_LEVEL_MAP,
        "model_type": "IsolationForest",
        "n_estimators": 100,
        "contamination": 0.10,
        "trained_at": pd.Timestamp.now().isoformat()
    }

    joblib.dump(artifact, model_path)
    print(f"Saved trained IsolationForest model artifact to: {model_path}")

if __name__ == "__main__":
    train_and_save_model()
