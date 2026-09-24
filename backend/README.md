# Smart Attendance Fraud Detection - Backend Services

This directory contains the backend microservices for the Smart Attendance Fraud Detection Platform.

## 1. Eureka Server (Service Discovery)

- **Directory**: `backend/eureka-server/`
- **Application Name**: `eureka-server`
- **Port**: `8761`
- **Eureka Dashboard URL**: [http://localhost:8761](http://localhost:8761)
- **Java Version**: `17`
- **Spring Boot Version**: `3.3.5`
- **Spring Cloud Version**: `2023.0.3`

### Commands
```bash
cd backend/eureka-server
mvn clean test
mvn spring-boot:run
```

---

## 2. API Gateway

- **Directory**: `backend/api-gateway/`
- **Application Name**: `api-gateway`
- **Port**: `8080`
- **Eureka Connection**: [http://localhost:8761](http://localhost:8761)
- **Purpose**: Centralized reactive API Gateway routing and service discovery registration.

### Commands
```bash
cd backend/api-gateway
mvn clean test
mvn spring-boot:run
```
