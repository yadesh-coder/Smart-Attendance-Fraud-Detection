from fastapi import APIRouter
from app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/api/ml", tags=["Health"])

@router.get("/health")
def get_health():
    model_loaded = AnomalyService.is_loaded()
    return {
        "service": "ML-SERVICE",
        "status": "UP",
        "model_status": "LOADED" if model_loaded else "NOT_FOUND",
        "model_type": "IsolationForest"
    }
