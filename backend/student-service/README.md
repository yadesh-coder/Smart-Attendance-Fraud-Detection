# Student Service

The **Student Service** manages student records, profiles, and first-time face & device enrollment workflows for the Smart Attendance Fraud Detection Platform.

---

## Technical Specifications
- **Port:** `8084`
- **Application Name:** `student-service`
- **Database:** Real MySQL (`attendance_student_db`)
- **Service Discovery:** Eureka (`http://localhost:8761`)
- **API Gateway Base Route:** `http://localhost:8081`

---

## Database Ownership
`attendance_student_db` contains three tables:
1. `students`:
   - `id` (BIGINT, Primary Key)
   - `user_id` (BIGINT, Foreign Key reference to Auth Service `users.id`)
   - `student_id` (VARCHAR(50), Unique, Not Null)
   - `full_name` (VARCHAR(255), Not Null)
   - `email` (VARCHAR(150), Unique, Not Null)
   - `phone` (VARCHAR(20))
   - `department` (VARCHAR(255), Not Null)
   - `course` (VARCHAR(255), Not Null)
   - `academic_year` (VARCHAR(50), Not Null)
   - `section` (VARCHAR(50), Not Null)
   - `status` (VARCHAR(20), Default: 'ACTIVE')
   - `enrollment_status` (VARCHAR(20), Default: 'PENDING')
2. `face_enrollments`:
   - `id` (BIGINT, Primary Key)
   - `student_id` (BIGINT, Not Null)
   - `status` (VARCHAR(20), Default: 'PENDING')
   - `model_version` (VARCHAR(50))
   - `template_reference` (VARCHAR(255)) -- Secure reference token only
3. `device_enrollments`:
   - `id` (BIGINT, Primary Key)
   - `student_id` (BIGINT, Not Null)
   - `device_fingerprint_hash` (VARCHAR(255)) -- SHA-256 privacy hash only
   - `device_label` (VARCHAR(100))
   - `status` (VARCHAR(20), Default: 'PENDING')

---

## API Documentation

### 1. Create Student (Faculty Only)
- **Method:** `POST`
- **Gateway URL:** `http://localhost:8081/api/faculty/students`
- **Headers:** `Authorization: Bearer <FACULTY_JWT>`
- **Body:**
```json
{
  "email": "alice@college.edu",
  "password": "initialStudentPass123",
  "fullName": "Alice Walker",
  "studentId": "STU1001",
  "phone": "9876543210",
  "department": "Computer Science & Engineering",
  "course": "B.Tech",
  "year": "1",
  "section": "A"
}
```

### 2. Get Student Profile (Student Self Access)
- **Method:** `GET`
- **Gateway URL:** `http://localhost:8081/api/student/profile`
- **Headers:** `Authorization: Bearer <STUDENT_JWT>`

### 3. Enrollment APIs (Student Only)
- `POST /api/student/enrollment/start`
- `GET /api/student/enrollment/status`
- `POST /api/student/enrollment/face`
- `POST /api/student/enrollment/device`
