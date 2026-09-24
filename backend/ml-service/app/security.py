import jwt
from fastapi import Header, HTTPException, status
from app.config import settings

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )

    token = authorization
    if token.startswith("Bearer "):
        token = token[7:]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256", "HS384", "HS512"])
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )

def verify_student_access(current_user: dict, target_student_user_id: int):
    user_id = current_user.get("userId")
    role = current_user.get("role")

    if role in ["STUDENT", "ROLE_STUDENT"]:
        if user_id is None or int(user_id) != int(target_student_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Students cannot retrieve another student's feature record."
            )
    elif role not in ["FACULTY", "ROLE_FACULTY", "ADMIN", "ROLE_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Unauthorized role."
        )
