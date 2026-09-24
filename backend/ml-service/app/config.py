import os



class Settings:

    SERVICE_NAME: str = "ML-SERVICE"

    PORT: int = int(os.environ.get("PORT", "8090"))



    MYSQL_HOST: str = os.environ.get("MYSQL_HOST", "localhost")

    MYSQL_PORT: int = int(os.environ.get("MYSQL_PORT", "3306"))

    MYSQL_USER: str = os.environ.get("MYSQL_USER", "root")

    MYSQL_PASSWORD: str = os.environ.get("MYSQL_PASSWORD", "nathiya06")



    JWT_SECRET: str = os.environ.get(

        "JWT_SECRET",

        "smart_attendance_fraud_detection_jwt_secret_key_32bytes_minimum"

    )



    EUREKA_SERVER: str = os.environ.get("EUREKA_SERVER", "http://localhost:8761/eureka/")



settings = Settings()
