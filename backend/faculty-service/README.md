# Faculty Service

The **Faculty Service** manages faculty profiles and integrates with **Auth Service** to manage faculty identities in the Smart Attendance Fraud Detection Platform.

---

## Technical Specifications
- **Port:** `8083`
- **Application Name:** `faculty-service`
- **Database:** Real MySQL (`attendance_faculty_db`)
- **Service Discovery:** Eureka (`http://localhost:8761`)
- **API Gateway Base Route:** `http://localhost:8081`

---

## Database Ownership
`attendance_faculty_db` contains the `faculty` table:
- `id` (BIGINT, Primary Key, Auto Increment)
- `user_id` (BIGINT, Foreign Key reference to Auth Service `users.id`)
- `employee_id` (VARCHAR(50), Unique, Not Null)
- `full_name` (VARCHAR(255), Not Null)
- `email` (VARCHAR(150), Unique, Not Null)
- `phone` (VARCHAR(20))
- `department` (VARCHAR(255), Not Null)
- `designation` (VARCHAR(255), Not Null)
- `status` (VARCHAR(20), Default: 'ACTIVE')
- `created_at` (DATETIME, Not Null)
- `updated_at` (DATETIME, Not Null)

---

## API & Postman Documentation

### 1. Create Faculty (Admin Only)
- **Method:** `POST`
- **Gateway URL:** `http://localhost:8081/api/admin/faculty`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Request Body:**
```json
{
  "email": "dr.smith@college.edu",
  "password": "initialFacultyPassword123",
  "fullName": "Dr. John Smith",
  "employeeId": "EMP10023",
  "phone": "9876543210",
  "department": "Computer Science & Engineering",
  "designation": "Associate Professor"
}
```
- **Expected Response (201 Created):**
```json
{
  "id": 1,
  "userId": 2,
  "employeeId": "EMP10023",
  "fullName": "Dr. John Smith",
  "email": "dr.smith@college.edu",
  "phone": "9876543210",
  "department": "Computer Science & Engineering",
  "designation": "Associate Professor",
  "status": "ACTIVE",
  "createdAt": "2026-08-13T10:49:45.728",
  "updatedAt": "2026-08-13T10:49:45.733"
}
```

---

### 2. Get All Faculty Members (Admin Only)
- **Method:** `GET`
- **Gateway URL:** `http://localhost:8081/api/admin/faculty`
- **Headers:**
  - `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "userId": 2,
    "employeeId": "EMP10023",
    "fullName": "Dr. John Smith",
    "email": "dr.smith@college.edu",
    "phone": "9876543210",
    "department": "Computer Science & Engineering",
    "designation": "Associate Professor",
    "status": "ACTIVE"
  }
]
```

---

### 3. Get Faculty Details By ID (Admin Only)
- **Method:** `GET`
- **Gateway URL:** `http://localhost:8081/api/admin/faculty/1`
- **Headers:**
  - `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Expected Response (200 OK):**
```json
{
  "id": 1,
  "userId": 2,
  "employeeId": "EMP10023",
  "fullName": "Dr. John Smith",
  "email": "dr.smith@college.edu",
  "phone": "9876543210",
  "department": "Computer Science & Engineering",
  "designation": "Associate Professor",
  "status": "ACTIVE"
}
```

---

### 4. Update Faculty Record (Admin Only)
- **Method:** `PUT`
- **Gateway URL:** `http://localhost:8081/api/admin/faculty/1`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Request Body:**
```json
{
  "fullName": "Dr. John Smith (Updated)",
  "designation": "Professor & Head of Department"
}
```
- **Expected Response (200 OK):**
```json
{
  "id": 1,
  "userId": 2,
  "employeeId": "EMP10023",
  "fullName": "Dr. John Smith (Updated)",
  "email": "dr.smith@college.edu",
  "phone": "9876543210",
  "department": "Computer Science & Engineering",
  "designation": "Professor & Head of Department",
  "status": "ACTIVE"
}
```

---

### 5. Deactivate Faculty Account (Admin Only)
- **Method:** `DELETE`
- **Gateway URL:** `http://localhost:8081/api/admin/faculty/1`
- **Headers:**
  - `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Expected Response (200 OK):**
```json
{
  "message": "Faculty account successfully deactivated."
}
```

---

### 6. Get Own Faculty Profile (Faculty Self Access)
- **Method:** `GET`
- **Gateway URL:** `http://localhost:8081/api/faculty/profile`
- **Headers:**
  - `Authorization: Bearer <FACULTY_JWT_TOKEN>`
- **Expected Response (200 OK):**
```json
{
  "id": 1,
  "userId": 2,
  "employeeId": "EMP10023",
  "fullName": "Dr. John Smith",
  "email": "dr.smith@college.edu",
  "phone": "9876543210",
  "department": "Computer Science & Engineering",
  "designation": "Associate Professor",
  "status": "ACTIVE"
}
```
