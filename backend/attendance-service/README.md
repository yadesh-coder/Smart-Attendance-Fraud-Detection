# Attendance Service

The **Attendance Service** manages attendance sessions, unique QR code generation & validation, verification attempt creation, and attendance history tracking for the Smart Attendance Fraud Detection Platform.

---

## Technical Specifications
- **Port:** `8085`
- **Application Name:** `attendance-service`
- **Database:** Real MySQL (`attendance_db`)
- **Service Discovery:** Eureka (`http://localhost:8761`)
- **API Gateway Base Route:** `http://localhost:8081`

---

## Database Ownership
`attendance_db` contains three tables:
1. `attendance_sessions`:
   - `id` (BIGINT, Primary Key)
   - `session_id` (VARCHAR(100), Unique, Not Null)
   - `faculty_user_id` (BIGINT, Not Null)
   - `subject_id` (VARCHAR(100), Not Null)
   - `subject_name` (VARCHAR(255))
   - `session_date` (VARCHAR(50), Not Null)
   - `start_time` (VARCHAR(50), Not Null)
   - `end_time` (VARCHAR(50), Not Null)
   - `status` (VARCHAR(20), Default: 'CREATED') -- CREATED, LIVE, CLOSED, EXPIRED
   - `qr_token_hash` (VARCHAR(255), Not Null) -- SHA-256 hash of plaintext QR token
   - `qr_issued_at` (DATETIME)
   - `qr_expires_at` (DATETIME)
2. `attendance_verification_attempts`:
   - `id` (BIGINT, Primary Key)
   - `attempt_id` (VARCHAR(100), Unique, Not Null)
   - `session_id` (VARCHAR(100), Not Null)
   - `student_user_id` (BIGINT, Not Null)
   - `qr_status` (VARCHAR(20), Default: 'QR_VALID')
   - `face_status` (VARCHAR(20), Default: 'NOT_AVAILABLE')
   - `location_status` (VARCHAR(20), Default: 'NOT_AVAILABLE')
   - `device_status` (VARCHAR(20), Default: 'NOT_AVAILABLE')
   - `overall_status` (VARCHAR(20), Default: 'PENDING')
3. `attendance_records`:
   - `id` (BIGINT, Primary Key)
   - `session_id` (VARCHAR(100), Not Null)
   - `student_user_id` (BIGINT, Not Null)
   - `verification_attempt_id` (VARCHAR(100))
   - `attendance_status` (VARCHAR(20), Default: 'PENDING') -- PENDING, PRESENT, REJECTED
   - `decision` (VARCHAR(20), Default: 'PENDING') -- PENDING, SAFE, SUSPICIOUS, FRAUD, REJECTED
   - `marked_at` (DATETIME, Not Null)
   - **Unique Constraint:** `(session_id, student_user_id)`

---

## API Documentation

### 1. Faculty Session Management (`/api/faculty/attendance/**` - FACULTY only)
- `POST /api/faculty/attendance/sessions`: Create attendance session (generates unique QR token).
- `GET /api/faculty/attendance/sessions`: List sessions owned by faculty.
- `GET /api/faculty/attendance/sessions/{id}`: View session details.
- `POST /api/faculty/attendance/sessions/{id}/start`: Start session (sets status `LIVE`, starts 15-minute QR timer).
- `POST /api/faculty/attendance/sessions/{id}/close`: Close session (sets status `CLOSED`).

### 2. Student Verification & History (`/api/student/attendance/**` - STUDENT only)
- `GET /api/student/attendance/live-sessions`: Fetch currently active `LIVE` sessions.
- `POST /api/student/attendance/verify-qr`: Submit session QR token for validation (`{"qrToken": "..."}`).
- `GET /api/student/attendance/history`: Fetch authenticated student's attendance history records.
