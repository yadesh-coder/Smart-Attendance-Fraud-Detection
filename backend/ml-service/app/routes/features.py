from fastapi import APIRouter, Depends, HTTPException, status

from pydantic import BaseModel

from app.database import fetch_one

from app.security import get_current_user, verify_student_access

from app.services.feature_service import FeatureService



router = APIRouter(prefix="/api/ml/features", tags=["ML Features"])



class GenerateFeaturesRequest(BaseModel):

    attemptId: str



@router.post("/generate", status_code=status.HTTP_201_CREATED)

def generate_features(

    body: GenerateFeaturesRequest,

    current_user: dict = Depends(get_current_user)

):

    try:

        # Pre-verify attempt existence & student ownership before running feature generation

        attempt = fetch_one(

            "attendance_db",

            "SELECT student_user_id FROM attendance_verification_attempts WHERE attempt_id = %s",

            (body.attemptId,)

        )

        if not attempt:

            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Verification attempt not found: {body.attemptId}")



        verify_student_access(current_user, attempt["student_user_id"])



        features = FeatureService.generate_features_for_attempt(attempt_id=body.attemptId)

        return features

    except ValueError as ve:

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    except HTTPException as he:

        raise he

    except Exception as e:

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Feature generation error: {str(e)}")



@router.get("/attempt/{attemptId}")

def get_features_by_attempt(

    attemptId: str,

    current_user: dict = Depends(get_current_user)

):

    features = FeatureService.get_features_by_attempt(attemptId)

    if not features:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature record not found for attempt")



    verify_student_access(current_user, features["student_user_id"])

    return features
