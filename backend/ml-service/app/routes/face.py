from fastapi import APIRouter, HTTPException, status

from pydantic import BaseModel

from typing import Optional, List

import base64

from app.services.face_service import FaceService



router = APIRouter(prefix="/api/ml/face", tags=["Face Recognition"])



class FaceEmbeddingRequest(BaseModel):

    image: Optional[str] = None

    frameBase64: Optional[str] = None



class FaceVerificationRequest(BaseModel):

    storedEmbedding: Optional[List[float]] = None

    image: Optional[str] = None

    frameBase64: Optional[str] = None



@router.post("/embedding", status_code=status.HTTP_200_OK)

def generate_face_embedding(body: FaceEmbeddingRequest):

    img_str = body.image or body.frameBase64

    if not img_str:

        return {

            "verified": False,

            "status": "FACE_INVALID",

            "facesDetected": 0,

            "message": "No image data provided."

        }



    clean_b64 = img_str

    if "," in clean_b64:

        clean_b64 = clean_b64.split(",")[1]



    try:

        image_bytes = base64.b64decode(clean_b64.strip())

    except Exception:

        return {

            "verified": False,

            "status": "FACE_INVALID",

            "facesDetected": 0,

            "message": "Invalid Base64 image encoding."

        }



    embedding, faces_cnt, status_code, meta = FaceService.extract_arcface_embedding(image_bytes)



    if status_code == "FACE_INVALID":

        return {

            "verified": False,

            "status": "FACE_INVALID",

            "facesDetected": 0,

            "message": "Invalid or unparseable image frame.",

            **meta

        }

    elif status_code == "FACE_NOT_DETECTED":

        return {

            "verified": False,

            "status": "FACE_NOT_DETECTED",

            "facesDetected": 0,

            "message": "No human face detected in frame.",

            **meta

        }

    elif status_code in ["MULTIPLE_FACES", "MULTIPLE_FACES_DETECTED"]:

        return {

            "verified": False,

            "status": "MULTIPLE_FACES_DETECTED",

            "facesDetected": faces_cnt,

            "message": "Multiple human faces detected in frame.",

            **meta

        }



    return {

        "verified": True,

        "status": "OK",

        "model": "ArcFace",

        "modelVersion": "buffalo_sc (w600k_mbf)",

        "embeddingDimension": 512,

        "facesDetected": 1,

        "embedding": embedding,

        **meta

    }



@router.post("/verify", status_code=status.HTTP_200_OK)

def verify_face_comparison(body: FaceVerificationRequest):

    if not body.storedEmbedding:

        return {

            "verified": False,

            "status": "FACE_ENROLLMENT_REQUIRED",

            "similarity": 0.0,

            "message": "No stored enrollment embedding provided."

        }



    img_str = body.image or body.frameBase64

    if not img_str:

        return {

            "verified": False,

            "status": "FACE_INVALID",

            "similarity": 0.0,

            "message": "No live image frame provided."

        }



    clean_b64 = img_str

    if "," in clean_b64:

        clean_b64 = clean_b64.split(",")[1]



    try:

        image_bytes = base64.b64decode(clean_b64.strip())

    except Exception:

        return {

            "verified": False,

            "status": "FACE_INVALID",

            "similarity": 0.0,

            "message": "Invalid Base64 image encoding."

        }



    live_emb, faces_cnt, status_code, meta = FaceService.extract_arcface_embedding(image_bytes)



    if status_code == "FACE_INVALID":

        return {

            "verified": False,

            "status": "FACE_INVALID",

            "similarity": 0.0,

            "message": "Invalid image frame.",

            **meta

        }

    elif status_code == "FACE_NOT_DETECTED":

        return {

            "verified": False,

            "status": "FACE_NOT_DETECTED",

            "similarity": 0.0,

            "message": "No human face detected in frame.",

            **meta

        }

    elif status_code in ["MULTIPLE_FACES", "MULTIPLE_FACES_DETECTED"]:

        return {

            "verified": False,

            "status": "MULTIPLE_FACES_DETECTED",

            "similarity": 0.0,

            "message": "Multiple human faces detected.",

            **meta

        }



    similarity = FaceService.compute_cosine_similarity(body.storedEmbedding, live_emb)

    THRESHOLD = 0.82



    is_match = similarity >= THRESHOLD



    return {

        "verified": is_match,

        "status": "FACE_MATCH" if is_match else "FACE_MISMATCH",

        "similarity": round(similarity, 4),

        "threshold": THRESHOLD,

        "model": "ArcFace",

        "embeddingDimension": 512,

        "facesDetected": 1,

        **meta

    }
