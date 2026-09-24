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

def get_row_counts():
    conn = mysql.connector.connect(host="localhost", port=3306, user="root", password="nathiya06")
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM attendance_auth_db.users WHERE role='ADMIN'")
    adm_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM attendance_faculty_db.faculty")
    fac_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM attendance_student_db.students")
    stu_cnt = cur.fetchone()[0]
    cur.close()
    conn.close()
    return adm_cnt, fac_cnt, stu_cnt

def run_regression_test():
    print_f("=== AUTOMATED REGRESSION TEST: PRESERVING LEGITIMATE FACULTY (ADMIN=1, FACULTY=1, STUDENTS=0) ===")
    ts = int(time.time())
    test_fac_email = f"manual_fac_2_{ts}@college.edu"
    test_stu_email = f"manual_stu_{ts}@student.edu"
    pass_temp = "TempPass123!"
    pass_new = "ActivePass123!"

    conn = http.client.HTTPConnection("localhost", 8081)

    try:
        # 1. VERIFY BASELINE WITH LEGITIMATE ACCOUNTS
        print_f("\n--- Step 1: Legitimate Baseline Verification ---")
        initial_adm, initial_fac, initial_stu = get_row_counts()
        print_f(f"Initial State -> Admin: {initial_adm} | Faculty: {initial_fac} | Students: {initial_stu}")
        assert initial_adm >= 1 and initial_fac >= 1, f"Expected Admin >= 1, Faculty >= 1; got Admin={initial_adm}, Faculty={initial_fac}"
        print_f(f"PASS: Legitimate baseline confirmed (Admin = {initial_adm}, Faculty = {initial_fac}, Students = {initial_stu}).")

        # 2. ADMIN LOGIN & DASHBOARD REFRESHES
        print_f("\n--- Step 2: Admin Login & Dashboard Page Navigation ---")
        status, data = make_req(conn, "POST", "/api/auth/login", {"email": "admin@college.edu", "password": "admin123"})
        assert status == 200, "Admin login failed"
        token_admin = json.loads(data)["token"]

        for _ in range(10):
            make_req(conn, "GET", "/api/auth/me", token=token_admin)
            make_req(conn, "GET", "/api/admin/faculty", token=token_admin)

        adm, fac, stu = get_row_counts()
        print_f(f"After Admin Navigation -> Admin: {adm} | Faculty: {fac} | Students: {stu}")
        assert adm == initial_adm and fac == initial_fac and stu == initial_stu, f"ERROR: DB counts changed during Admin navigation! Admin={adm}, Faculty={fac}, Students={stu}"
        print_f("PASS: Admin login and dashboard navigation created ZERO additional faculty/students and preserved existing accounts.")

        # 3. MANUAL FACULTY CREATION (+1 FACULTY)
        print_f("\n--- Step 3: Explicit Manual Faculty Creation ---")
        fac_payload = {
            "email": test_fac_email,
            "password": pass_temp,
            "fullName": f"Dr. Second Faculty {ts}",
            "employeeId": f"EMP_MAN2_{ts}",
            "department": "Computer Science",
            "designation": "Professor",
            "phone": "9876543210"
        }
        status, data = make_req(conn, "POST", "/api/admin/faculty", fac_payload, token_admin)
        assert status == 201, f"Manual faculty creation failed: {data}"

        adm, fac, stu = get_row_counts()
        print_f(f"After Manual Faculty Creation -> Admin: {adm} | Faculty: {fac} | Students: {stu}")
        assert adm == initial_adm and fac == initial_fac + 1 and stu == initial_stu, f"Expected Faculty = {initial_fac + 1}, Students = {initial_stu}; got Faculty = {fac}, Students = {stu}"
        print_f("PASS: Explicit manual creation added exactly 1 new faculty.")

        # 4. FACULTY LOGIN & PERSISTENCE
        print_f("\n--- Step 4: Faculty Initial Login & Password Activation ---")
        status, data = make_req(conn, "POST", "/api/auth/login", {"email": test_fac_email, "password": pass_temp})
        assert status == 200, "Faculty initial login failed"
        token_fac_temp = json.loads(data)["token"]

        status, _ = make_req(conn, "PUT", "/api/auth/password", {"currentPassword": pass_temp, "newPassword": pass_new}, token_fac_temp)
        assert status == 200, "Faculty password activation failed"

        status, data = make_req(conn, "POST", "/api/auth/login", {"email": test_fac_email, "password": pass_new})
        assert status == 200, "Faculty active login failed"
        token_fac = json.loads(data)["token"]

        for _ in range(5):
            make_req(conn, "GET", "/api/faculty/students", token=token_fac)
            make_req(conn, "GET", "/api/faculty/subjects", token=token_fac)

        adm, fac, stu = get_row_counts()
        print_f(f"After Faculty Navigation -> Admin: {adm} | Faculty: {fac} | Students: {stu}")
        assert adm == initial_adm and fac == initial_fac + 1 and stu == initial_stu, f"Faculty disappeared or students created! Faculty={fac}, Students={stu}"
        print_f("PASS: Both legitimate existing faculty and newly created faculty persisted cleanly.")

        # 5. MANUAL STUDENT CREATION (+1 STUDENT)
        print_f("\n--- Step 5: Explicit Manual Student Creation ---")
        stu_payload = {
            "email": test_stu_email,
            "password": pass_temp,
            "fullName": f"Regression Student {ts}",
            "studentId": f"STU_REG_{ts}",
            "department": "Computer Science",
            "course": "B.Tech",
            "year": "3",
            "section": "A",
            "phone": "9876543211"
        }
        status, data = make_req(conn, "POST", "/api/faculty/students", stu_payload, token_fac)
        assert status == 201, f"Manual student creation failed: {data}"

        adm, fac, stu = get_row_counts()
        print_f(f"After Manual Student Creation -> Admin: {adm} | Faculty: {fac} | Students: {stu}")
        assert adm == initial_adm and fac == initial_fac + 1 and stu == initial_stu + 1, f"Expected Faculty = {initial_fac + 1}, Students = {initial_stu + 1}; got Faculty = {fac}, Students = {stu}"
        print_f("PASS: Explicit manual creation added exactly 1 student.")

        # 6. 30-SECOND LONG-RUNNING MONITORING
        print_f("\n--- Step 6: 30-Second Long-Running Monitoring Window ---")
        start_time = time.time()
        checks = 0
        while time.time() - start_time < 30:
            time.sleep(5)
            checks += 1
            make_req(conn, "GET", "/api/admin/faculty", token=token_admin)
            make_req(conn, "GET", "/api/faculty/students", token=token_fac)
            adm_m, fac_m, stu_m = get_row_counts()
            print_f(f"  [{int(time.time() - start_time)}s] DB Counts -> Admin: {adm_m} | Faculty: {fac_m} | Students: {stu_m}")
            assert adm_m == initial_adm and fac_m == initial_fac + 1 and stu_m == initial_stu + 1, f"DB counts changed during monitoring! Faculty={fac_m}, Students={stu_m}"

        print_f(f"PASS: Monitored system for 30 seconds ({checks} checks). Zero unexpected creations or deletions.")
        print_f("\n=== ALL REGRESSION TESTS PASSED 100% ===")

    finally:
        # Safe targeted teardown of ONLY test-created accounts (never delete legitimate faculty)
        try:
            conn_db = mysql.connector.connect(host="localhost", port=3306, user="root", password="nathiya06")
            cur_db = conn_db.cursor()
            cur_db.execute("DELETE FROM attendance_faculty_db.faculty WHERE email = %s", (test_fac_email,))
            cur_db.execute("DELETE FROM attendance_student_db.students WHERE email = %s", (test_stu_email,))
            cur_db.execute("DELETE FROM attendance_auth_db.users WHERE email IN (%s, %s)", (test_fac_email, test_stu_email))
            conn_db.commit()
            cur_db.close()
            conn_db.close()
            print_f("\nPASS: Safe targeted teardown complete. Only test accounts cleaned up. Legitimate faculty preserved.")
        except Exception as e:
            print_f("Teardown note:", e)

if __name__ == "__main__":
    run_regression_test()
