<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.
https://ai.studio/apps/d23e97d5-2d1f-4782-b0b4-5aeb81219c64

## Database Setup

The microservice suite requires MySQL (v8.0+) running on port `3306`. Execute the following SQL commands to initialize the required databases:

```sql
CREATE DATABASE IF NOT EXISTS attendance_auth_db;
CREATE DATABASE IF NOT EXISTS attendance_faculty_db;
CREATE DATABASE IF NOT EXISTS attendance_student_db;
CREATE DATABASE IF NOT EXISTS attendance_db;
```

> **Note**: Spring Boot Hibernate auto-update (`hibernate.ddl-auto=update`) automatically manages table schema creation upon service startup.

## Development Startup Order

To run the complete platform locally, start the microservices and services in the following order:

1. **Eureka Server** (`backend/eureka-server`, Port `8761`)
2. **API Gateway** (`backend/api-gateway`, Port `8081`)
3. **Auth Service** (`backend/auth-service`, Port `8082`)
4. **Faculty Service** (`backend/faculty-service`, Port `8083`)
5. **Student Service** (`backend/student-service`, Port `8084`)
6. **Attendance Service** (`backend/attendance-service`, Port `8085`)
7. **Face Service** (`backend/face-service`, Port `8086`)
8. **Device Service** (`backend/device-service`, Port `8087`)
9. **Location Service** (`backend/location-service`, Port `8088`)
10. **Fraud Service** (`backend/fraud-service`, Port `8089`)
11. **ML Service** (`backend/ml-service`, Port `8090`)
12. **Frontend** (Vite, Port `5173`)

## Run Locally

**Prerequisites:** Node.js (v18+), Java (v17+), Maven, Python (v3.10+), MySQL (v8.0+)

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`