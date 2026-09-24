import pytest
import requests
import json
import mysql.connector
import time

GATEWAY_URL = "http://localhost:8081"
MYSQL_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "nathiya06",
}

def get_db_connection(db_name):
    return mysql.connector.connect(
        host=MYSQL_CONFIG["host"],
        port=MYSQL_CONFIG["port"],
        user=MYSQL_CONFIG["user"],
        password=MYSQL_CONFIG["password"],
        database=db_name,
        autocommit=True
    )

def test_student_biometrics_and_location_e2e():
    print("\n=== STARTING STUDENT BIOMETRICS & LOCATION REGRESSION SUITE ===")

    # 0. Setup test faculty and test student credentials
    ts = int(time.time())
    test_faculty_email = f"fac_bio_test_{ts}@college.edu"
    test_student_email_a = f"stu_bio_a_{ts}@college.edu"
    test_student_email_b = f"stu_bio_b_{ts}@college.edu"
    test_student_id_a = f"STU_BIO_A_{ts}"
    test_student_id_b = f"STU_BIO_B_{ts}"
    password = "TestPassword123!"

    # 1. Admin login to create faculty
    admin_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
        "email": "admin@college.edu",
        "password": "admin123"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Create Faculty
    test_emp_id = f"EMP_BIO_{ts}"
    create_fac_res = requests.post(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers, json={
        "email": test_faculty_email,
        "fullName": "Dr. Biometrics Tester",
        "employeeId": test_emp_id,
        "password": password,
        "department": "Computer Science & Engineering"
    })
    assert create_fac_res.status_code in [200, 201], f"Faculty creation failed: {create_fac_res.text}"
    faculty_id = create_fac_res.json()["id"]

    # Faculty login
    fac_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
        "email": test_faculty_email,
        "password": password
    })
    assert fac_login_res.status_code == 200, f"Faculty login failed: {fac_login_res.text}"
    fac_token = fac_login_res.json()["token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    # Change faculty initial password if required
    if fac_login_res.json().get("mustChangePassword"):
        ch_res = requests.put(f"{GATEWAY_URL}/api/auth/password", headers=fac_headers, json={
            "currentPassword": password,
            "newPassword": "NewFacultyPassword123!"
        })
        assert ch_res.status_code == 200, f"Password change failed: {ch_res.text}"
        password = "NewFacultyPassword123!"
        fac_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
            "email": test_faculty_email,
            "password": password
        })
        fac_token = fac_login_res.json()["token"]
        fac_headers = {"Authorization": f"Bearer {fac_token}"}

    # 3. Create Student A and Student B
    create_stu_a_res = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": test_student_email_a,
        "fullName": "Student Alpha Biometric",
        "studentId": test_student_id_a,
        "password": password,
        "department": "Computer Science & Engineering"
    })
    assert create_stu_a_res.status_code in [200, 201], f"Student A creation failed: {create_stu_a_res.text}"

    create_stu_b_res = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": test_student_email_b,
        "fullName": "Student Beta Biometric",
        "studentId": test_student_id_b,
        "password": password,
        "department": "Computer Science & Engineering"
    })
    assert create_stu_b_res.status_code in [200, 201], f"Student B creation failed: {create_stu_b_res.text}"

    try:
        # 4. Student A Login
        stu_a_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
            "email": test_student_email_a,
            "password": password
        })
        assert stu_a_login_res.status_code == 200, f"Student A login failed: {stu_a_login_res.text}"
        stu_a_data = stu_a_login_res.json()
        stu_a_token = stu_a_data["token"]
        stu_a_headers = {"Authorization": f"Bearer {stu_a_token}"}

        # Verify initially setup complete is FALSE
        is_setup_init = stu_a_data["user"].get("isFirstTimeSetupComplete", stu_a_data["user"].get("firstTimeSetupComplete", False))
        assert is_setup_init == False, f"New student should be pending setup, got: {is_setup_init}"

        # 5. Face Enrollment for Student A
        face_frame = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
        face_res = requests.post(f"{GATEWAY_URL}/api/student/face/enroll", headers=stu_a_headers, json={
            "frame": face_frame
        })
        assert face_res.status_code == 200, f"Face enrollment failed: {face_res.text}"
        assert face_res.json()["status"] == "COMPLETED"

        # Check DB for Student A Face Enrollments count
        conn_stu = get_db_connection("attendance_student_db")
        with conn_stu.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT id FROM students WHERE LOWER(email) = %s", (test_student_email_a.lower(),))
            stu_a_row = cursor.fetchone()
            stu_a_db_id = stu_a_row["id"]

            cursor.execute("SELECT count(*) as cnt FROM face_enrollments WHERE student_id = %s", (stu_a_db_id,))
            face_cnt = cursor.fetchone()["cnt"]
            assert face_cnt == 1, f"Expected 1 face enrollment, found {face_cnt}"

        # Repeat Face Enrollment -> must update in place without duplicate
        face_res_repeat = requests.post(f"{GATEWAY_URL}/api/student/face/enroll", headers=stu_a_headers, json={
            "frame": face_frame
        })
        assert face_res_repeat.status_code == 200
        with conn_stu.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT count(*) as cnt FROM face_enrollments WHERE student_id = %s", (stu_a_db_id,))
            face_cnt_repeat = cursor.fetchone()["cnt"]
            assert face_cnt_repeat == 1, f"Repeated face enrollment created duplicate rows: {face_cnt_repeat}"

        # 6. Device Fingerprint Enrollment for Student A
        dev_ua = f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBio/{ts}"
        dev_res = requests.post(f"{GATEWAY_URL}/api/student/device/enroll", headers=stu_a_headers, json={
            "deviceLabel": "Student Alpha Laptop",
            "userAgent": dev_ua,
            "platform": "Win32",
            "screenDimensions": "1920x1080",
            "timezone": "Asia/Kolkata"
        })
        assert dev_res.status_code == 200, f"Device enrollment failed: {dev_res.text}"

        with conn_stu.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT count(*) as cnt FROM device_enrollments WHERE student_id = %s", (stu_a_db_id,))
            dev_cnt = cursor.fetchone()["cnt"]
            assert dev_cnt == 1, f"Expected 1 device enrollment, found {dev_cnt}"

            cursor.execute("SELECT device_fingerprint_hash FROM device_enrollments WHERE student_id = %s", (stu_a_db_id,))
            dev_hash = cursor.fetchone()["device_fingerprint_hash"]

            cursor.execute("SELECT enrollment_status FROM students WHERE id = %s", (stu_a_db_id,))
            overall_status = cursor.fetchone()["enrollment_status"]
            assert overall_status == "COMPLETED", f"Expected COMPLETED, got {overall_status}"

        # Repeat Device Enrollment -> must update in place
        dev_res_repeat = requests.post(f"{GATEWAY_URL}/api/student/device/enroll", headers=stu_a_headers, json={
            "deviceLabel": "Student Alpha Laptop Updated",
            "userAgent": dev_ua,
            "platform": "Win32",
            "screenDimensions": "1920x1080",
            "timezone": "Asia/Kolkata"
        })
        assert dev_res_repeat.status_code == 200
        with conn_stu.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT count(*) as cnt FROM device_enrollments WHERE student_id = %s", (stu_a_db_id,))
            dev_cnt_repeat = cursor.fetchone()["cnt"]
            assert dev_cnt_repeat == 1, f"Repeated device enrollment created duplicate rows: {dev_cnt_repeat}"

        # 7. Cross-Account Device Protection Check
        # Student B attempts to register Student A's device signals -> HTTP 409 Conflict
        stu_b_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
            "email": test_student_email_b,
            "password": password
        })
        stu_b_token = stu_b_login_res.json()["token"]
        stu_b_headers = {"Authorization": f"Bearer {stu_b_token}"}

        conflict_res = requests.post(f"{GATEWAY_URL}/api/student/device/enroll", headers=stu_b_headers, json={
            "deviceLabel": "Stolen Device",
            "userAgent": dev_ua,
            "platform": "Win32",
            "screenDimensions": "1920x1080",
            "timezone": "Asia/Kolkata"
        })
        assert conflict_res.status_code == 409, f"Expected 409 Conflict when binding registered device to another student, got: {conflict_res.status_code}"

        # 8. Verify Persistence across Login / Logout / Refresh / Auth Me
        # Re-login Student A
        re_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
            "email": test_student_email_a,
            "password": password
        })
        assert re_login_res.status_code == 200
        re_setup = re_login_res.json()["user"].get("isFirstTimeSetupComplete", re_login_res.json()["user"].get("firstTimeSetupComplete"))
        assert re_setup == True, f"isFirstTimeSetupComplete must be true after completion on re-login, got {re_setup}"

        # Check /api/auth/me
        me_res = requests.get(f"{GATEWAY_URL}/api/auth/me", headers=stu_a_headers)
        assert me_res.status_code == 200
        me_setup = me_res.json().get("isFirstTimeSetupComplete", me_res.json().get("firstTimeSetupComplete"))
        assert me_setup == True, f"/api/auth/me must return setup complete=True, got {me_setup}"

        # Check /api/student/enrollment/status
        status_res = requests.get(f"{GATEWAY_URL}/api/student/enrollment/status", headers=stu_a_headers)
        assert status_res.status_code == 200
        assert status_res.json()["enrollmentComplete"] == True
        assert status_res.json()["faceEnrollmentStatus"] == "COMPLETED"
        assert status_res.json()["deviceEnrollmentStatus"] == "COMPLETED"

        # 9. Location Verification Tests (Valid, Outside Radius, Error cases)
        # Faculty creates subject
        subj_res = requests.post(f"{GATEWAY_URL}/api/faculty/subjects", headers=fac_headers, json={
            "subjectCode": "SUB_BIO_101",
            "subjectName": "Biometrics Systems",
            "department": "Computer Science & Engineering",
            "course": "B.Tech",
            "academicYear": "2026",
            "semester": "6",
            "section": "A"
        })
        assert subj_res.status_code in [200, 201], f"Subject creation failed: {subj_res.text}"
        created_subj_id = subj_res.json()["subjectId"]

        # Faculty creates attendance session
        sess_res = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", headers=fac_headers, json={
            "subjectId": created_subj_id,
            "subjectName": "Biometrics Systems",
            "sessionDate": "2026-08-14",
            "startTime": "09:00",
            "endTime": "10:00",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "allowedRadiusMeters": 100.0
        })
        assert sess_res.status_code in [200, 201], f"Session creation failed: {sess_res.text}"
        sess_data = sess_res.json()
        session_id = sess_data["sessionId"]

        # A. Valid Location (Coordinates inside 100m radius)
        loc_valid_res = requests.post(f"{GATEWAY_URL}/api/student/location/verify", headers=stu_a_headers, json={
            "sessionId": session_id,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "accuracy": 10.0
        })
        assert loc_valid_res.status_code == 200, f"Location verify error: {loc_valid_res.text}"
        loc_valid_data = loc_valid_res.json()
        assert loc_valid_data["status"] == "LOCATION_VALID", f"Expected LOCATION_VALID, got: {loc_valid_data['status']}"
        assert loc_valid_data["verified"] == True

        # B. Out of Bounds Location (Coordinates ~3km away)
        loc_out_res = requests.post(f"{GATEWAY_URL}/api/student/location/verify", headers=stu_a_headers, json={
            "sessionId": session_id,
            "latitude": 13.0000,
            "longitude": 77.5946,
            "accuracy": 10.0
        })
        assert loc_out_res.status_code == 200, f"Location verify error: {loc_out_res.text}"
        loc_out_data = loc_out_res.json()
        assert loc_out_data["status"] == "LOCATION_OUTSIDE_RADIUS", f"Expected LOCATION_OUTSIDE_RADIUS, got: {loc_out_data['status']}"
        assert loc_out_data["verified"] == False

        # C. Invalid / Non-existent session ID
        loc_invalid_res = requests.post(f"{GATEWAY_URL}/api/student/location/verify", headers=stu_a_headers, json={
            "sessionId": "NON_EXISTENT_SESSION_999",
            "latitude": 12.9716,
            "longitude": 77.5946
        })
        assert loc_invalid_res.status_code in [400, 404], f"Expected 404/400 for invalid session, got: {loc_invalid_res.status_code}"

        # 10. Automatic Creation Prevention Check
        # Perform 10 refresh calls on student endpoints
        for _ in range(10):
            requests.get(f"{GATEWAY_URL}/api/student/enrollment/status", headers=stu_a_headers)
            requests.get(f"{GATEWAY_URL}/api/student/profile", headers=stu_a_headers)
            requests.get(f"{GATEWAY_URL}/api/auth/me", headers=stu_a_headers)

        # Verify DB counts for student profiles and face enrollments are unchanged
        with conn_stu.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT count(*) as cnt FROM face_enrollments WHERE student_id = %s", (stu_a_db_id,))
            final_face_cnt = cursor.fetchone()["cnt"]
            assert final_face_cnt == 1, f"Refreshes triggered automatic creation! Count: {final_face_cnt}"

        print("=== ALL BIOMETRIC & LOCATION REGRESSION TESTS PASSED 100% ===")

    finally:
        # Teardown: Clean test records
        conn_auth = get_db_connection("attendance_auth_db")
        conn_stu = get_db_connection("attendance_student_db")
        conn_fac = get_db_connection("attendance_faculty_db")
        conn_dev = get_db_connection("attendance_device_db")
        conn_att = get_db_connection("attendance_db")

        with conn_dev.cursor(dictionary=True) as cursor:
            cursor.execute("DELETE FROM device_enrollments WHERE student_email IN (%s, %s)", (test_student_email_a, test_student_email_b))

        with conn_stu.cursor(dictionary=True) as cursor:
            cursor.execute("DELETE FROM face_enrollments WHERE student_id IN (SELECT id FROM students WHERE email IN (%s, %s))", (test_student_email_a, test_student_email_b))
            cursor.execute("DELETE FROM device_enrollments WHERE student_id IN (SELECT id FROM students WHERE email IN (%s, %s))", (test_student_email_a, test_student_email_b))
            cursor.execute("DELETE FROM students WHERE email IN (%s, %s)", (test_student_email_a, test_student_email_b))

        with conn_auth.cursor(dictionary=True) as cursor:
            cursor.execute("DELETE FROM users WHERE email IN (%s, %s, %s)", (test_faculty_email, test_student_email_a, test_student_email_b))

        with conn_att.cursor(dictionary=True) as cursor:
            cursor.execute("DELETE FROM attendance_sessions WHERE faculty_user_id = %s", (faculty_id,))

        with conn_fac.cursor(dictionary=True) as cursor:
            cursor.execute("DELETE FROM subjects WHERE subject_code = 'SUB_BIO_101'")
            cursor.execute("DELETE FROM faculty WHERE email = %s", (test_faculty_email,))

if __name__ == "__main__":
    test_student_biometrics_and_location_e2e()
