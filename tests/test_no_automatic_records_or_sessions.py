import http.client
import json
import time
import mysql.connector

def print_f(*args, **kwargs):
    print(*args, **kwargs, flush=True)

def make_req(conn, method, path, body=None, token=None):
    headers = {}
    if token:
        headers["Authorization"] = "Bearer " + token
    if body is not None:
        headers["Content-Type"] = "application/json"
        b_str = json.dumps(body) if isinstance(body, dict) else body
        conn.request(method, path, b_str, headers)
    else:
        conn.request(method, path, headers=headers)
    res = conn.getresponse()
    data = res.read().decode()
    return res.status, data

def get_db_counts():
    conn = mysql.connector.connect(host="localhost", port=3306, user="root", password="nathiya06")
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_auth_db.users WHERE role = 'ADMIN'")
    admin_cnt = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_auth_db.users WHERE role = 'FACULTY'")
    fac_cnt = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_auth_db.users WHERE role = 'STUDENT'")
    stu_cnt = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_db.attendance_sessions")
    sess_cnt = cur.fetchone()["cnt"]

    cur.close()
    conn.close()
    return admin_cnt, fac_cnt, stu_cnt, sess_cnt

def run_strict_regression_test():
    print_f("=========================================================================")
    print_f("=== REGRESSION TEST: ZERO AUTOMATIC CREATIONS & CLEAN TEARDOWN ===")
    print_f("=========================================================================")

    conn = http.client.HTTPConnection("localhost", 8081)

    # 1. Record Initial Baseline DB State
    init_admin, init_fac, init_stu, init_sess = get_db_counts()
    print_f(f"Initial State -> Admin: {init_admin} | Faculty: {init_fac} | Students: {init_stu} | Sessions: {init_sess}")
    assert init_admin == 1, "Admin account missing!"

    # 2. Admin Login & Refresh x10
    print_f("\n--- Step 1: Admin Login & Refresh x10 ---")
    status, data = make_req(conn, "POST", "/api/auth/login", {"email": "admin@college.edu", "password": "admin123"})
    assert status == 200, f"Admin login failed: {data}"
    admin_token = json.loads(data)["token"]

    for i in range(10):
        make_req(conn, "GET", "/api/auth/me", token=admin_token)
        make_req(conn, "GET", "/api/admin/faculty", token=admin_token)

    a1, f1, st1, se1 = get_db_counts()
    assert (a1, f1, st1, se1) == (init_admin, init_fac, init_stu, init_sess), "Counts changed after Admin navigation!"
    print_f("PASS: Admin login & 10 refreshes maintained 100% constant database counts.")

    # 3. Create Temporary Faculty for Test
    print_f("\n--- Step 2: Create Temporary Faculty for Workflow Testing ---")
    temp_fac_email = f"temp_fac_{int(time.time())}@college.edu"
    status, data_fac = make_req(conn, "POST", "/api/admin/faculty", {
        "email": temp_fac_email,
        "password": "FacultyPass123!",
        "fullName": "Temporary Faculty",
        "employeeId": f"EMP_TEMP_{int(time.time())}",
        "department": "Computer Science",
        "designation": "Professor",
        "phone": "9876543210"
    }, token=admin_token)
    assert status == 201, f"Admin faculty creation failed: {data_fac}"

    status, data_login = make_req(conn, "POST", "/api/auth/login", {"email": temp_fac_email, "password": "FacultyPass123!"})
    assert status == 200, f"Temporary faculty login failed: {data_login}"
    fac_token = json.loads(data_login)["token"]

    # Create Temporary Subject for Session Testing
    subj_code = f"CS_{int(time.time())}"
    status, data_subj = make_req(conn, "POST", "/api/faculty/subjects", {
        "subjectCode": subj_code,
        "subjectName": "Temporary Testing Subject",
        "department": "Computer Science",
        "semester": "3"
    }, token=fac_token)
    assert status == 201, f"Faculty subject creation failed: {data_subj}"
    subj_obj = json.loads(data_subj)
    subj_id = subj_obj["subjectId"]

    # 4. Faculty Navigation Refresh x10
    for i in range(10):
        make_req(conn, "GET", "/api/auth/me", token=fac_token)
        make_req(conn, "GET", "/api/faculty/profile", token=fac_token)
        make_req(conn, "GET", "/api/faculty/attendance/sessions", token=fac_token)
    print_f("PASS: Faculty login & 10 refreshes executed cleanly.")

    # 5. Create Temporary Student for Test
    print_f("\n--- Step 3: Create Temporary Student for Workflow Testing ---")
    temp_stu_email = f"temp_stu_{int(time.time())}@student.edu"
    status, data_stu = make_req(conn, "POST", "/api/faculty/students", {
        "email": temp_stu_email,
        "password": "StudentPass123!",
        "fullName": "Temporary Student",
        "studentId": f"STU_TEMP_{int(time.time())}",
        "department": "Computer Science",
        "course": "B.Tech",
        "year": "3",
        "section": "A",
        "phone": "9876543210"
    }, token=fac_token)
    assert status == 201, f"Faculty student creation failed: {data_stu}"

    status, log_stu = make_req(conn, "POST", "/api/auth/login", {"email": temp_stu_email, "password": "StudentPass123!"})
    assert status == 200, f"Temporary student login failed: {log_stu}"
    stu_token = json.loads(log_stu)["token"]

    for i in range(10):
        make_req(conn, "GET", "/api/auth/me", token=stu_token)
        make_req(conn, "GET", "/api/student/profile", token=stu_token)
        make_req(conn, "GET", "/api/student/attendance/live-sessions", token=stu_token)
    print_f("PASS: Student login & 10 refreshes executed cleanly.")

    # 6. Student Session Creation Protection Check
    print_f("\n--- Step 4: Authorization Check - Student Attempting Session Creation ---")
    status, data_403 = make_req(conn, "POST", "/api/faculty/attendance/sessions", {
        "subjectId": subj_id,
        "subjectName": "Illegal Student Session Creation Attempt",
        "sessionDate": "2026-08-14",
        "startTime": "10:00",
        "endTime": "11:00"
    }, token=stu_token)
    assert status == 403, f"Expected 403 Forbidden for Student session creation attempt, got {status}: {data_403}"
    print_f("PASS: Student attempt to create session correctly rejected with HTTP 403 Forbidden.")

    # 7. Faculty Creates 1 Session & Verifies Refresh Consistency
    print_f("\n--- Step 5: Faculty Creates Session & Verifies Refresh Consistency ---")
    status, data_sess = make_req(conn, "POST", "/api/faculty/attendance/sessions", {
        "subjectId": subj_id,
        "subjectName": "Temporary Testing Subject",
        "sessionDate": "2026-08-14",
        "startTime": "11:00",
        "endTime": "12:00",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "allowedRadiusMeters": 100.0
    }, token=fac_token)
    assert status == 201, f"Faculty session creation failed ({status}): {data_sess}"
    sess_obj = json.loads(data_sess)
    sess_id = sess_obj["sessionId"]
    qr_token = sess_obj["qrToken"]
    code_6digit = sess_obj["attendanceCode"]

    for i in range(5):
        status, data_ref = make_req(conn, "GET", f"/api/faculty/attendance/sessions/{sess_id}", token=fac_token)
        assert status == 200
        s_ref = json.loads(data_ref)
        assert s_ref["sessionId"] == sess_id
        assert s_ref["qrToken"] == qr_token
        assert s_ref["attendanceCode"] == code_6digit
    print_f("PASS: Faculty session ID, QR token, and 6-digit attendance code remained 100% static across refreshes.")

    # 8. Clean Teardown of Temporary Test Data
    print_f("\n--- Step 6: Cleaning Up Temporary Test Records ---")
    conn_db = mysql.connector.connect(host="localhost", port=3306, user="root", password="nathiya06")
    cur_db = conn_db.cursor()
    cur_db.execute("DELETE FROM attendance_db.attendance_sessions WHERE session_id = %s", (sess_id,))
    cur_db.execute("DELETE FROM attendance_faculty_db.subjects WHERE subject_id = %s", (subj_id,))
    cur_db.execute("DELETE FROM attendance_student_db.students WHERE email = %s", (temp_stu_email,))
    cur_db.execute("DELETE FROM attendance_faculty_db.faculty WHERE email = %s", (temp_fac_email,))
    cur_db.execute("DELETE FROM attendance_auth_db.users WHERE email IN (%s, %s)", (temp_fac_email, temp_stu_email))
    conn_db.commit()
    cur_db.close()
    conn_db.close()
    print_f("PASS: Temporary test data cleaned up cleanly.")

    # 9. Verify Final DB Baseline matches Initial Clean Baseline
    final_admin, final_fac, final_stu, final_sess = get_db_counts()
    print_f(f"Final DB Baseline -> Admin: {final_admin} | Faculty: {final_fac} | Students: {final_stu} | Sessions: {final_sess}")
    assert (final_admin, final_fac, final_stu, final_sess) == (init_admin, init_fac, init_stu, init_sess), "Final database baseline changed after test!"

    print_f("\n=========================================================================")
    print_f("=== HARD REGRESSION TEST PASSED 100% WITH CLEAN BASELINE RESTORED ===")
    print_f("=========================================================================")

if __name__ == "__main__":
    run_strict_regression_test()
