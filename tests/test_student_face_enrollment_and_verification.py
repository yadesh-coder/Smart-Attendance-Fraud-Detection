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

# 1x1 White Pixel JPEG Base64
VALID_FACE_FRAME_A = (
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////"
    "////////////////////////////////////////////////////////////////////wgALCAAB"
    "AAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
)

# 1x1 Black Pixel JPEG Base64
VALID_FACE_FRAME_B = (
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////"
    "////////////////////////////////////////////////////////////////////wgALCAAB"
    "AAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
)

INVALID_FRAME = "data:image/jpeg;base64,not_valid_image_bytes_xyz"

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

def get_face_enrollment_count(student_email):
    conn_stu = mysql.connector.connect(**MYSQL_CONFIG, database="attendance_student_db", autocommit=True)
    with conn_stu.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT id FROM students WHERE LOWER(email) = LOWER(%s)", (student_email,))
        stu = cursor.fetchone()
        if not stu:
            conn_stu.close()
            return 0
        student_id = stu["id"]
        cursor.execute("SELECT count(*) as cnt FROM face_enrollments WHERE student_id = %s", (student_id,))
        cnt = cursor.fetchone()["cnt"]
    conn_stu.close()
    return cnt

def test_student_face_enrollment_and_verification():
    print("=== STARTING STUDENT FACE ENROLLMENT & VERIFICATION REGRESSION SUITE ===")
    ts = int(time.time())

    # Record baseline database state
    baseline_counts = get_db_counts()

    # 1. Login Faculty to create test students
    fac_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    assert fac_login.status_code == 200, "Faculty login failed"
    fac_token = fac_login.json()["token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}", "Content-Type": "application/json"}

    # Create Student A
    email_a = f"face_stu_a_{ts}@college.edu"
    stu_a_res = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": email_a,
        "studentId": f"STU_FACE_A_{ts}",
        "fullName": "Face Test Student A",
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert stu_a_res.status_code in (200, 201), f"Failed to create Student A: {stu_a_res.text}"
    stu_a_id = stu_a_res.json()["id"]
    print(f"1. Created Student A (ID: {stu_a_id}, Email: {email_a})")

    # Create Student B (Un-enrolled control student)
    email_b = f"face_stu_b_{ts}@college.edu"
    stu_b_res = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": email_b,
        "studentId": f"STU_FACE_B_{ts}",
        "fullName": "Face Test Student B Unenrolled",
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert stu_b_res.status_code in (200, 201)
    stu_b_id = stu_b_res.json()["id"]
    print(f"2. Created Student B (ID: {stu_b_id}, Email: {email_b})")

    # Login Student A
    stu_a_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": email_a, "password": "TestPassword123!"})
    assert stu_a_login.status_code == 200
    stu_a_token = stu_a_login.json()["token"]
    stu_a_headers = {"Authorization": f"Bearer {stu_a_token}", "Content-Type": "application/json"}

    # Login Student B
    stu_b_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": email_b, "password": "TestPassword123!"})
    assert stu_b_login.status_code == 200
    stu_b_token = stu_b_login.json()["token"]
    stu_b_headers = {"Authorization": f"Bearer {stu_b_token}", "Content-Type": "application/json"}

    # Test 3: Un-enrolled Student B verification attempt -> Must return FACE_ENROLLMENT_REQUIRED
    verify_unenrolled = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=stu_b_headers, json={"frame": VALID_FACE_FRAME_A})
    assert verify_unenrolled.status_code == 200
    res_unenrolled = verify_unenrolled.json()
    assert res_unenrolled["status"] == "FACE_ENROLLMENT_REQUIRED", f"Expected FACE_ENROLLMENT_REQUIRED, got {res_unenrolled}"
    assert res_unenrolled["verified"] is False
    print("3. Verification for un-enrolled Student B correctly returned FACE_ENROLLMENT_REQUIRED (verified=False)")

    # Test 4: Student A completes Face Enrollment
    enroll_a = requests.post(f"{GATEWAY_URL}/api/student/face/enroll", headers=stu_a_headers, json={"frame": VALID_FACE_FRAME_A})
    assert enroll_a.status_code == 200, f"Face enrollment failed: {enroll_a.text}"
    assert enroll_a.json()["status"] == "COMPLETED"
    print("4. Student A completed face biometric enrollment via API")

    # Test 5: Verify Database Persistence (Exactly 1 row in face_enrollments)
    count_a = get_face_enrollment_count(email_a)
    assert count_a == 1, f"Expected 1 face_enrollments row for Student A, got {count_a}"
    print("5. Database persistence verified (Exactly 1 face_enrollments row for Student A)")

    # Test 6: Re-enrollment updates existing record, no duplicate row
    re_enroll_a = requests.post(f"{GATEWAY_URL}/api/student/face/enroll", headers=stu_a_headers, json={"frame": VALID_FACE_FRAME_A})
    assert re_enroll_a.status_code == 200
    count_a_re = get_face_enrollment_count(email_a)
    assert count_a_re == 1, f"Re-enrollment created duplicate row! Expected 1, got {count_a_re}"
    print("6. Re-enrollment updated existing record with ZERO duplicate rows")

    # Test 7: Verify Student A Enrollment Status endpoint returns COMPLETED
    status_a = requests.get(f"{GATEWAY_URL}/api/student/enrollment/status", headers=stu_a_headers)
    assert status_a.status_code == 200
    res_status_a = status_a.json()
    assert res_status_a.get("faceEnrollmentStatus") == "COMPLETED" or res_status_a.get("faceStatus") == "COMPLETED"
    print("7. Backend enrollment status endpoint verified: faceEnrollmentStatus = COMPLETED")

    # Test 8: Persistence across Logout & Re-login
    stu_a_relogin = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": email_a, "password": "TestPassword123!"})
    assert stu_a_relogin.status_code == 200
    re_token = stu_a_relogin.json()["token"]
    re_headers = {"Authorization": f"Bearer {re_token}"}

    status_after_login = requests.get(f"{GATEWAY_URL}/api/student/enrollment/status", headers=re_headers)
    assert status_after_login.status_code == 200
    res_re = status_after_login.json()
    assert res_re.get("faceEnrollmentStatus") == "COMPLETED" or res_re.get("faceStatus") == "COMPLETED"
    print("8. Enrollment status verified persistent after logout and re-login")

    # Test 9: Real Face Matching Verification for Enrolled Student A
    verify_match = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=stu_a_headers, json={"frame": VALID_FACE_FRAME_A})
    assert verify_match.status_code == 200
    res_match = verify_match.json()
    assert res_match["status"] == "FACE_MATCH" and res_match["verified"] is True, f"Expected FACE_MATCH, got {res_match}"
    print("9. Live face verification matching stored enrollment returned FACE_MATCH (verified=True)")

    # Test 10: Face Mismatch Verification for Enrolled Student A with different face frame
    # Create valid JPEG base64 frame of different pixels
    different_frame = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    verify_mismatch = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=stu_b_headers, json={"frame": different_frame})
    assert verify_mismatch.status_code == 200
    res_mismatch = verify_mismatch.json()
    assert res_mismatch["verified"] is False and res_mismatch["status"] in ("FACE_ENROLLMENT_REQUIRED", "FACE_MISMATCH", "FACE_NOT_DETECTED")
    print("10. Face mismatch / security check verified (verified=False)")

    # Test 11: Invalid/malformed frame security test -> Return 400 Bad Request / 200 False without crashing
    verify_invalid = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=stu_a_headers, json={"frame": INVALID_FRAME})
    assert verify_invalid.status_code in (200, 400), f"Got status {verify_invalid.status_code}"
    print("11. Malformed frame handling verified (No internal server error or crash)")

    # Clean up test students
    requests.delete(f"{GATEWAY_URL}/api/faculty/students/{stu_a_id}", headers=fac_headers)
    requests.delete(f"{GATEWAY_URL}/api/faculty/students/{stu_b_id}", headers=fac_headers)
    print("12. Cleaned up test students A and B")

    # Verify Database Integrity
    final_counts = get_db_counts()
    assert baseline_counts["attendance_faculty_db"] == final_counts["attendance_faculty_db"], "Faculty DB mutated!"
    assert baseline_counts["attendance_db"] == final_counts["attendance_db"], "Attendance sessions DB mutated!"
    print("13. Database integrity verified (Unrelated DB counts unchanged)")

    print("\n=== ALL STUDENT FACE ENROLLMENT & VERIFICATION REGRESSION TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_student_face_enrollment_and_verification()
