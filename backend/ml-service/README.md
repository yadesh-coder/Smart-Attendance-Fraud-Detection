# ML-SERVICE (Port 8090) — AI/ML Anomaly Detection

## Overview

`ML-SERVICE` provides unsupervised machine learning anomaly detection and feature engineering for the Smart Attendance Fraud Detection Platform.

It consumes verification signals (QR, Face, Device, Location) and deterministic fraud assessments to compute ML feature vectors and perform real-time anomaly detection using `scikit-learn` `IsolationForest`.

> [!IMPORTANT]
> `FRAUD-SERVICE` remains the authoritative attendance decision engine. `ML-SERVICE` provides an auxiliary machine-learning anomaly signal (`anomaly_score` and `anomaly_label`) to complement deterministic rule evaluation.

---

## Machine Learning Architecture

### Model Selection: IsolationForest

* **Algorithm**: `sklearn.ensemble.IsolationForest`
* **Type**: Unsupervised Anomaly Detection
* **Configuration**: `n_estimators=100`, `contamination=0.10`, `random_state=42`
* **Artifact Location**: `backend/ml-service/models/isolation_forest_model.joblib`

### Features Used

1. `qr_valid`: Binary encoding (1=Valid, 0=Invalid, -1=Missing)
2. `face_valid`: Binary encoding (1=Match, 0=Mismatch, -1=Missing)
3. `device_valid`: Binary encoding (1=Recognized, 0=Mismatch/New, -1=Missing)
4. `location_valid`: Binary encoding (1=Valid, 0=Out of Bounds, -1=Missing)
5. `device_known`: Binary encoding (1=Known, 0=Unknown, -1=Missing)
6. `device_change_indicator`: Binary encoding (1=Change detected, 0=No change, -1=Missing)
7. `attendance_hour`: Integer hour of attempt creation (0-23)
8. `attendance_day_of_week`: Integer weekday of attempt creation (1=Mon, 7=Sun)
9. `fraud_rule_count`: Count of triggered deterministic rules
10. `deterministic_risk_level_encoded`: Ordinal encoding (0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL)

---

## Training Pipeline

The model training process is reproducible using `train_model.py`:

```bash
cd backend/ml-service
python train_model.py
```

### Training Dataset

* **Samples**: 5,000 synthetic attendance attempt records
* **Distribution**: ~90% realistic normal attendance, ~10% anomalous patterns (biometric mismatch, boundary violation, un-enrolled device, off-peak hours, rule triggers).
* **Reproducibility**: Seeded with `random_state=42`.

---

## Inference Pipeline

When a feature vector is generated via `POST /api/ml/features/generate`:

1. `FeatureService` compiles attendance signals and historical aggregates.
2. `AnomalyService` passes the feature vector to the loaded `IsolationForest` model.
3. `model.decision_function(X)` produces `anomaly_score`.
4. `model.predict(X)` produces `anomaly_label`:
   * `NORMAL`: Standard inlier pattern
   * `ANOMALOUS`: Outlier / anomalous pattern
5. Features and ML predictions are saved to `attendance_ml_db.ml_attendance_features`.

---

## Health Endpoint

```http
GET /api/ml/health
```

### Response Example

```json
{
  "service": "ML-SERVICE",
  "status": "UP",
  "model_status": "LOADED",
  "model_type": "IsolationForest"
}
```

If model artifact is missing or invalid:

```json
{
  "service": "ML-SERVICE",
  "status": "UP",
  "model_status": "NOT_FOUND",
  "model_type": "IsolationForest"
}
```

---

## Model Retraining Guidelines

When sufficient anonymized real attendance logs accumulate in production:

1. Export anonymized feature vectors from `attendance_ml_db.ml_attendance_features`.
2. Execute `python train_model.py` with real historical feature data.
3. Verify model metrics and re-test with `pytest tests/`.
4. Restart `ML-SERVICE` to load the updated `isolation_forest_model.joblib`.
