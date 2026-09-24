from fastapi import APIRouter, Depends, HTTPException, status

from pydantic import BaseModel

from typing import Optional, Dict, Any

from app.security import get_current_user

from app.services.anomaly_service import AnomalyService

from app.services.feature_service import FeatureService



router = APIRouter(prefix="/api/ml", tags=["ML Prediction"])



class PredictRequest(BaseModel):

    attemptId: Optional[str] = None

    features: Optional[Dict[str, Any]] = None



@router.post("/predict", status_code=status.HTTP_200_OK)

def predict_anomaly(

    body: PredictRequest,

    current_user: dict = Depends(get_current_user)

):

    try:

        feat_dict = {}

        if body.attemptId:

            feat_dict = FeatureService.get_features_by_attempt(body.attemptId) or {}

            if not feat_dict:

                feat_dict = FeatureService.generate_features_for_attempt(body.attemptId) or {}



        if body.features:

            feat_dict.update(body.features)



        result = AnomalyService.predict(feat_dict)

        return {

            "attemptId": body.attemptId,

            "anomalyScore": result.get("anomaly_score"),

            "anomalyLabel": result.get("anomaly_label"),

            "modelStatus": result.get("model_status"),

            "featuresEvaluated": feat_dict

        }

    except Exception as e:

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"ML Prediction Error: {str(e)}")
