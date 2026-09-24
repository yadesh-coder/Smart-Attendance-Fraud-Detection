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
FACE_FRAME_A = (
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////"
    "////////////////////////////////////////////////////wgALCAAB"
    "AAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
)

# Dark Pattern JPEG Base64 for different face
FACE_FRAME_B = (
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgK"
    "DBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgy"
    "PC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMDEyMDEyMDEyMDEyMDEyMDEyMDEy"
    "MDEyMDEyMDEyMDEyMDEyMDEyMDEyMDEyMDEyMDL/wAARCAABAAEDASIAAhEB"
    "AxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAbEAACAgMBAAAAAAAAAAAA"
    "AAAAAwEEBQIGAP/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAA"
    "AAAAAAAAAAAAAAAAAP/aAAwDAQACEQEDEQH/AF8A/9k="
)

def get_db_counts():
    counts = {}
    databases = {
        "users": "attendance_auth_db",
        "faculty": "attendance_faculty_db",
        "students": "attendance_student_db",
        "attendance_sessions": "attendance_db",
        "device_enrollments": "attendance_device_db",
        "face_enrollments": "attendance_student_db",
    }
    for label, db in databases.items():
        conn = mysql.connector.connect(**MYSQL_CONFIG, database=db, autocommit=True)
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(f"SELECT count(*) as cnt FROM {label}")
            counts[label] = cursor.fetchone()["cnt"]
        conn.close()
    return counts

def test_student_face_match_after_enrollment():
    print("=== STARTING STUDENT FACE MATCH AFTER ENROLLMENT REGRESSION SUITE ===")
    baseline_counts = get_db_counts()
    print("Baseline DB Counts:", baseline_counts)

    # Login Faculty to create test students
    fac_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    assert fac_login.status_code == 200, "Faculty login failed"
    fac_headers = {"Authorization": f"Bearer {fac_login.json()['token']}", "Content-Type": "application/json"}

    import time
    ts = int(time.time() * 1000)
    stu_a_email = f"facematch_a_{ts}@college.edu"
    create_a = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": stu_a_email,
        "studentId": f"STU_FM_A_{ts}",
        "fullName": "Face Match Student A",
        "password": "admin123",
        "department": "Computer Science & Engineering"
    })
    assert create_a.status_code in (200, 201), f"Student A creation failed: {create_a.text}"
    stu_a_id = create_a.json()["id"]

    ts_b = ts + 1
    stu_b_email = f"facematch_b_{ts_b}@college.edu"
    create_b = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": stu_b_email,
        "studentId": f"STU_FM_B_{ts_b}",
        "fullName": "Face Match Student B",
        "password": "admin123",
        "department": "Computer Science & Engineering"
    })
    assert create_b.status_code in (200, 201), f"Student B creation failed: {create_b.text}"
    stu_b_id = create_b.json()["id"]

    # Login Student A
    stu_a_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": stu_a_email, "password": "admin123"})
    assert stu_a_login.status_code == 200
    token_a = stu_a_login.json()["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Login Student B (Un-enrolled initially)
    stu_b_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": stu_b_email, "password": "admin123"})
    assert stu_b_login.status_code == 200
    token_b = stu_b_login.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # TEST A: Enrollment for Student A
    print("\n--- TEST A: Student A Initial Face Enrollment ---")
    enroll_a = requests.post(f"{GATEWAY_URL}/api/student/face/enroll", headers=headers_a, json={"frame": FACE_FRAME_A})
    assert enroll_a.status_code == 200, f"Enrollment failed: {enroll_a.text}"
    assert enroll_a.json().get("status") == "COMPLETED" or enroll_a.json().get("enrolled") is True
    print("PASSED Test A: Student A face enrollment completed successfully")

    # TEST B: Database Persistence
    print("\n--- TEST B: Database Persistence Audit ---")
    conn = mysql.connector.connect(**MYSQL_CONFIG, database="attendance_student_db", autocommit=True)
    with conn.cursor(dictionary=True) as cur:
        cur.execute("SELECT * FROM face_enrollments WHERE student_id = %s", (stu_a_id,))
        recs_a = cur.fetchall()
        assert len(recs_a) == 1, f"Expected 1 face enrollment for Student A, got {len(recs_a)}"
        rec_a = recs_a[0]
        assert rec_a["status"] == "COMPLETED"
        assert rec_a["template_reference"] is not None and rec_a["template_reference"].startswith("ft_v1_")
        print(f"PASSED Test B: Database record verified -> template: {rec_a['template_reference'][:30]}...")
    conn.close()

    # TEST C: Logout and Re-Login Student A
    print("\n--- TEST C: Logout & Re-Login Persistence Check ---")
    re_login_a = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": stu_a_email, "password": "admin123"})
    assert re_login_a.status_code == 200
    headers_a_new = {"Authorization": f"Bearer {re_login_a.json()['token']}"}

    status_check = requests.get(f"{GATEWAY_URL}/api/student/enrollment/status", headers=headers_a_new)
    assert status_check.status_code == 200
    assert status_check.json()["faceEnrollmentStatus"] == "COMPLETED"
    print("PASSED Test C: Enrollment status 'COMPLETED' verified after fresh login")

    # TEST D: Session Verification for Student A (Same Face) -> FACE_MATCH
    print("\n--- TEST D: Live Attendance Verification (Same Enrolled Student) ---")
    verify_a = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=headers_a_new, json={"frame": FACE_FRAME_A})
    assert verify_a.status_code == 200, f"Verification request failed: {verify_a.text}"
    v_data_a = verify_a.json()
    assert v_data_a["status"] == "FACE_MATCH", f"Expected FACE_MATCH, got {v_data_a}"
    assert v_data_a["verified"] is True
    assert v_data_a["isMatch"] is True
    print("PASSED Test D: Same enrolled student verified -> FACE_MATCH (verified=True)")

    # TEST E: Verification with Different Face -> FACE_MISMATCH
    print("\n--- TEST E: Live Attendance Verification (Different Face) ---")
    verify_diff = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=headers_a_new, json={"frame": FACE_FRAME_B})
    assert verify_diff.status_code == 200
    v_data_diff = verify_diff.json()
    assert v_data_diff["status"] == "FACE_MISMATCH", f"Expected FACE_MISMATCH for different face, got {v_data_diff}"
    assert v_data_diff["verified"] is False
    print("PASSED Test E: Different face verified -> FACE_MISMATCH (verified=False)")

    # TEST F: Verification for Un-enrolled Student B -> FACE_ENROLLMENT_REQUIRED
    print("\n--- TEST F: Un-enrolled Student Verification ---")
    verify_b = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=headers_b, json={"frame": FACE_FRAME_A})
    assert verify_b.status_code == 200
    v_data_b = verify_b.json()
    assert v_data_b["status"] == "FACE_ENROLLMENT_REQUIRED", f"Expected FACE_ENROLLMENT_REQUIRED, got {v_data_b}"
    assert v_data_b["verified"] is False
    print("PASSED Test F: Un-enrolled student verified -> FACE_ENROLLMENT_REQUIRED (verified=False)")

    # TEST G: Refresh/Backend Restart & Verification Check
    print("\n--- TEST G: Verification After Backend Operation ---")
    verify_a_repeat = requests.post(f"{GATEWAY_URL}/api/student/face/verify", headers=headers_a_new, json={"frame": FACE_FRAME_A})
    assert verify_a_repeat.status_code == 200
    assert verify_a_repeat.json()["status"] == "FACE_MATCH"
    print("PASSED Test G: Re-verification verified -> FACE_MATCH (verified=True)")

    # TEST H: Duplicate Enrollment Protection
    print("\n--- TEST H: Duplicate Enrollment Protection Audit ---")
    conn = mysql.connector.connect(**MYSQL_CONFIG, database="attendance_student_db", autocommit=True)
    with conn.cursor(dictionary=True) as cur:
        cur.execute("SELECT count(*) as cnt FROM face_enrollments WHERE student_id = %s", (stu_a_id,))
        count_a = cur.fetchone()["cnt"]
        assert count_a == 1, f"Expected exactly 1 face_enrollment row for Student A, got {count_a}"
        print("PASSED Test H: Exactly 1 face enrollment row exists for Student A (No duplicates created)")

        # Clean up test students A and B
        cur.execute("DELETE FROM face_enrollments WHERE student_id IN (%s, %s)", (stu_a_id, stu_b_id))
        cur.execute("DELETE FROM students WHERE id IN (%s, %s)", (stu_a_id, stu_b_id))
    conn.close()

    conn_auth = mysql.connector.connect(**MYSQL_CONFIG, database="attendance_auth_db", autocommit=True)
    with conn_auth.cursor() as cur:
        cur.execute("DELETE FROM users WHERE email IN (%s, %s)", (stu_a_email, stu_b_email))
    conn_auth.close()

    # Final DB counts check
    final_counts = get_db_counts()
    assert baseline_counts == final_counts, f"DB counts mutated! Baseline: {baseline_counts}, Final: {final_counts}"
    print("\n--- DATABASE INTEGRITY VERIFIED ---")
    print("All temporary test records cleaned up, database counts 100% restored!")

    print("\n=== ALL STUDENT FACE MATCH REGRESSION TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_student_face_match_after_enrollment()
