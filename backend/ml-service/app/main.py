import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager
import py_eureka_client.eureka_client as eureka_client

from app.config import settings
from app.routes import health, features, predict, face

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await eureka_client.init_async(
            eureka_server="http://localhost:8761/eureka",
            app_name=settings.SERVICE_NAME,
            instance_port=settings.PORT,
            instance_host="127.0.0.1"
        )
        print(f"Registered {settings.SERVICE_NAME} on port {settings.PORT} with Eureka at http://localhost:8761/eureka")
    except Exception as e:
        print(f"Eureka registration warning: {e}")
    yield
    try:
        await eureka_client.stop_async()
    except Exception:
        pass

app = FastAPI(
    title="ML-SERVICE",
    description="Smart Attendance Fraud Detection Platform - ML Feature Foundation Service",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(health.router)
app.include_router(features.router)
app.include_router(predict.router)
app.include_router(face.router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=False)