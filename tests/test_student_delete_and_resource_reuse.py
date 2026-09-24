import time
import requests
import mysql.connector

GATEWAY_URL = "http://localhost:8081"
MYSQL_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "nathiya06",
}

def get_db_counts():
    counts = {}
    for db in ["attendance_auth_db", "attendance_faculty_db", "attendance_student_db", "attendance_db", "attendance_device_db"]:
        conn = mysql.connector.connect(**MYSQL_CONFIG, database=db, autocommit=True)
        with conn.cursor(dictionary=True) as cursor:
            if db == "attendance_auth_db":
                cursor.execute("SELECT count(*) as cnt FROM users")
            elif db == "attendance_faculty_db":
                cursor.execute("SELECT count(*) as cnt FROM faculty")
            elif db == "attendance_student_db":
                cursor.execute("SELECT count(*) as cnt FROM students")
            elif db == "attendance_db":
                cursor.execute("SELECT count(*) as cnt FROM attendance_sessions")
            elif db == "attendance_device_db":
                cursor.execute("SELECT count(*) as cnt FROM device_enrollments")
            counts[db] = cursor.fetchone()["cnt"]
        conn.close()
    return counts

def check_orphans():
    conn_auth = mysql.connector.connect(**MYSQL_CONFIG, database="attendance_auth_db", autocommit=True)
    conn_stu = mysql.connector.connect(**MYSQL_CONFIG, database="attendance_student_db", autocommit=True)

    with conn_auth.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT id, email, role FROM users")
        auth_users = {u["email"].lower(): u for u in cursor.fetchall()}

    with conn_stu.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT id, user_id, email FROM students")
        stu_records = {s["email"].lower(): s for s in cursor.fetchall()}

    conn_auth.close()
    conn_stu.close()

    orphans_auth = [u for e, u in auth_users.items() if u["role"] == "STUDENT" and e not in stu_records]
    orphans_stu = [s for e, s in stu_records.items() if e not in auth_users]

    return len(orphans_auth) + len(orphans_stu)

def test_student_delete_and_resource_reuse():
    print("=== STARTING STUDENT DELETE & RESOURCE REUSE REGRESSION SUITE ===")
    ts = int(time.time())

    # 1. Login Faculty
    fac_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    assert fac_login.status_code == 200
    fac_token = fac_login.json()["token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}", "Content-Type": "application/json"}

    baseline_counts = get_db_counts()

    # Create Student A
    reusable_email = f"reuse_stu_{ts}@college.edu"
    stu_id_a = f"STU_A_{ts}"

    create_a = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": reusable_email,
        "studentId": stu_id_a,
        "fullName": "Student A Reusable",
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert create_a.status_code in (200, 201), f"Student A creation failed: {create_a.text}"
    stu_a_data = create_a.json()
    stu_a_id = stu_a_data["id"]
    print(f"1. Created Student A (ID: {stu_a_id}, Email: {reusable_email})")

    # Login Student A and enroll Device
    stu_a_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": reusable_email, "password": "TestPassword123!"})
    assert stu_a_login.status_code == 200
    stu_a_token = stu_a_login.json()["token"]
    stu_a_headers = {"Authorization": f"Bearer {stu_a_token}", "Content-Type": "application/json"}

    shared_device_payload = {
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "platform": "Win32",
        "language": "en-US",
        "screenDimensions": "1920x1080",
        "timezone": "Asia/Kolkata",
        "hardwareConcurrency": "8",
        "deviceMemory": "8",
        "touchSupport": "false",
        "deviceLabel": "Shared Testing Laptop"
    }

    enroll_dev_a = requests.post(f"{GATEWAY_URL}/api/student/device/enroll", headers=stu_a_headers, json=shared_device_payload)
    assert enroll_dev_a.status_code == 200, f"Device enrollment failed for Student A: {enroll_dev_a.text}"
    print("2. Student A enrolled physical device successfully")

    # Active Email Conflict Test: Create Student C with Student A's email while Student A is ACTIVE
    active_email_conflict = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": reusable_email,
        "studentId": f"STU_CONFLICT_{ts}",
        "fullName": "Active Email Conflict Tester",
        "password": "TestPassword123!"
    })
    assert active_email_conflict.status_code == 409, f"Expected 409 for active email conflict, got {active_email_conflict.status_code}"
    print("3. Active email conflict protection verified (409 Conflict)")

    # DELETE Student A
    delete_a = requests.delete(f"{GATEWAY_URL}/api/faculty/students/{stu_a_id}", headers=fac_headers)
    assert delete_a.status_code == 200, f"Student A deletion failed: {delete_a.text}"
    print(f"4. Student A (ID: {stu_a_id}) DELETED via API")

    # Verify Student A is gone from Admin/Faculty list
    list_stu = requests.get(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers)
    assert list_stu.status_code == 200
    assert not any(s.get("email") == reusable_email for s in list_stu.json()), "Student A still present in students list!"
    print("5. Student A verified removed from Student list")

    # Create Student B using the EXACT SAME EMAIL
    stu_id_b = f"STU_B_{ts}"
    create_b = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": reusable_email,  # SAME REUSED EMAIL!
        "studentId": stu_id_b,
        "fullName": "Student B Reused Email",
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert create_b.status_code in (200, 201), f"Student B creation with reused email failed: {create_b.text}"
    stu_b_data = create_b.json()
    stu_b_id = stu_b_data["id"]
    print(f"6. Created Student B (ID: {stu_b_id}) using REUSED EMAIL ({reusable_email}) -> 201 Created!")

    # Login Student B and enroll SAME PHYSICAL DEVICE
    stu_b_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": reusable_email, "password": "TestPassword123!"})
    assert stu_b_login.status_code == 200
    stu_b_token = stu_b_login.json()["token"]
    stu_b_headers = {"Authorization": f"Bearer {stu_b_token}", "Content-Type": "application/json"}

    enroll_dev_b = requests.post(f"{GATEWAY_URL}/api/student/device/enroll", headers=stu_b_headers, json=shared_device_payload)
    assert enroll_dev_b.status_code == 200, f"Device enrollment failed for Student B with reused device: {enroll_dev_b.text}"
    print("7. Student B enrolled SAME PHYSICAL DEVICE successfully -> 200 OK!")

    # Create Student C (Active)
    stu_c_email = f"stu_c_{ts}@college.edu"
    stu_id_c = f"STU_C_{ts}"
    create_c = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": stu_c_email,
        "studentId": stu_id_c,
        "fullName": "Student C Active Device Test",
        "password": "TestPassword123!"
    })
    assert create_c.status_code in (200, 201)
    stu_c_data = create_c.json()
    stu_c_id = stu_c_data["id"]

    stu_c_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": stu_c_email, "password": "TestPassword123!"})
    stu_c_token = stu_c_login.json()["token"]
    stu_c_headers = {"Authorization": f"Bearer {stu_c_token}", "Content-Type": "application/json"}

    # Active Device Conflict Test: Student C attempts to enroll Student B's device while Student B is ACTIVE
    enroll_dev_c_conflict = requests.post(f"{GATEWAY_URL}/api/student/device/enroll", headers=stu_c_headers, json=shared_device_payload)
    assert enroll_dev_c_conflict.status_code == 409, f"Expected 409 for active device conflict, got {enroll_dev_c_conflict.status_code}"
    print("8. Active device conflict protection verified (409 Conflict when Student B is ACTIVE)")

    # Clean up Student B and Student C
    requests.delete(f"{GATEWAY_URL}/api/faculty/students/{stu_b_id}", headers=fac_headers)
    requests.delete(f"{GATEWAY_URL}/api/faculty/students/{stu_c_id}", headers=fac_headers)
    print("9. Cleaned up Student B and Student C")

    # Verify zero orphans
    assert check_orphans() == 0, "Orphan records detected!"
    print("10. Zero orphan records verified")

    final_counts = get_db_counts()
    assert baseline_counts["attendance_faculty_db"] == final_counts["attendance_faculty_db"], "Faculty database mutated!"
    assert baseline_counts["attendance_db"] == final_counts["attendance_db"], "Attendance sessions mutated!"
    print("11. Unrelated database counts verified unchanged")

    print("\n=== ALL STUDENT DELETE & RESOURCE REUSE TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_student_delete_and_resource_reuse()
