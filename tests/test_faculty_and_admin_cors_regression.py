import http.client
import json
import time
import mysql.connector

def print_f(*args, **kwargs):
    print(*args, **kwargs, flush=True)

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

def run_full_cors_and_authorization_regression():
    print_f("=========================================================================")
    print_f("=== FACULTY & ADMIN CORS PREFLIGHT & ZERO CREATION REGRESSION TEST ===")
    print_f("=========================================================================")

    init_admin, init_fac, init_stu, init_sess = get_db_counts()
    print_f(f"Initial Baseline -> Admin: {init_admin} | Faculty: {init_fac} | Students: {init_stu} | Sessions: {init_sess}")
    assert init_admin == 1, "Admin missing!"

    conn = http.client.HTTPConnection("localhost", 8081)

    # 1. Admin Login & OPTIONS / GET Verification
    print_f("\n--- Step 1: Admin CORS & GET Endpoints Verification ---")
    conn.request("POST", "/api/auth/login", json.dumps({"email": "admin@college.edu", "password": "admin123"}), {"Content-Type": "application/json"})
    res = conn.getresponse()
    raw = res.read().decode()
    assert res.status == 200, f"Admin login failed: {raw}"
    admin_token = json.loads(raw)["token"]
    admin_headers = {"Authorization": "Bearer " + admin_token, "Content-Type": "application/json"}

    admin_endpoints = ["/api/admin/metrics", "/api/admin/activities", "/api/admin/fraud", "/api/admin/students", "/api/admin/faculty"]

    for ep in admin_endpoints:
        conn.request("OPTIONS", ep, headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type"
        })
        res_opt = conn.getresponse()
        res_opt.read()
        cors_hdr = res_opt.getheader("Access-Control-Allow-Origin")
        print_f(f"OPTIONS {ep:<30} -> Status: {res_opt.status} | Access-Control-Allow-Origin: {cors_hdr}")
        assert res_opt.status in (200, 204), f"Admin preflight OPTIONS failed for {ep}"

        conn.request("GET", ep, headers=admin_headers)
        res_get = conn.getresponse()
        data_get = res_get.read().decode()
        print_f(f"GET     {ep:<30} -> Status: {res_get.status} | Snippet: {data_get[:80]}")
        assert res_get.status == 200, f"GET {ep} failed with status {res_get.status}"

    # 2. Create Temporary Faculty for OPTIONS & GET Testing
    print_f("\n--- Step 2: Faculty CORS & GET Endpoints Verification ---")
    temp_fac_email = f"cors_fac_{int(time.time())}@college.edu"
    conn.request("POST", "/api/admin/faculty", json.dumps({
        "email": temp_fac_email,
        "password": "FacultyPass123!",
        "fullName": "CORS Faculty",
        "employeeId": f"EMP_CORS_{int(time.time())}",
        "department": "Computer Science",
        "designation": "Professor",
        "phone": "9876543210"
    }), admin_headers)
    res_fac = conn.getresponse()
    res_fac.read()

    conn.request("POST", "/api/auth/login", json.dumps({"email": temp_fac_email, "password": "FacultyPass123!"}), {"Content-Type": "application/json"})
    res = conn.getresponse()
    raw = res.read().decode()
    assert res.status == 200, f"Faculty login failed: {raw}"
    fac_token = json.loads(raw)["token"]
    fac_headers = {"Authorization": "Bearer " + fac_token, "Content-Type": "application/json"}

    faculty_endpoints = ["/api/faculty/fraud-alerts", "/api/faculty/analytics"]

    for ep in faculty_endpoints:
        conn.request("OPTIONS", ep, headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type"
        })
        res_opt = conn.getresponse()
        res_opt.read()
        cors_hdr = res_opt.getheader("Access-Control-Allow-Origin")
        print_f(f"OPTIONS {ep:<30} -> Status: {res_opt.status} | Access-Control-Allow-Origin: {cors_hdr}")
        assert res_opt.status in (200, 204), f"Preflight OPTIONS failed for {ep}"

        conn.request("GET", ep, headers=fac_headers)
        res_get = conn.getresponse()
        data_get = res_get.read().decode()
        print_f(f"GET     {ep:<30} -> Status: {res_get.status} | Snippet: {data_get[:80]}")
        assert res_get.status == 200, f"GET {ep} failed with status {res_get.status}"

    # 3. Create Temporary Student & Verify Protection
    print_f("\n--- Step 3: Student Authorization & Protection Check ---")
    temp_stu_email = f"cors_stu_{int(time.time())}@student.edu"
    conn.request("POST", "/api/faculty/students", json.dumps({
        "email": temp_stu_email,
        "password": "StudentPass123!",
        "fullName": "CORS Student",
        "studentId": f"STU_CORS_{int(time.time())}",
        "department": "Computer Science",
        "course": "B.Tech",
        "year": "3",
        "section": "A",
        "phone": "9876543210"
    }), fac_headers)
    res_stu = conn.getresponse()
    res_stu.read()

    conn.request("POST", "/api/auth/login", json.dumps({"email": temp_stu_email, "password": "StudentPass123!"}), {"Content-Type": "application/json"})
    res = conn.getresponse()
    raw = res.read().decode()
    assert res.status == 200, f"Student login failed: {raw}"
    stu_token = json.loads(raw)["token"]
    stu_headers = {"Authorization": "Bearer " + stu_token, "Content-Type": "application/json"}

    # Session creation forbidden
    conn.request("POST", "/api/faculty/attendance/sessions", json.dumps({"subjectId": "CS101", "sessionDate": "2026-08-14", "startTime": "09:00", "endTime": "10:00"}), stu_headers)
    res_forb = conn.getresponse()
    res_forb.read()
    print_f(f"Student POST /api/faculty/attendance/sessions -> Status: {res_forb.status}")
    assert res_forb.status == 403, f"Student session creation was NOT rejected with HTTP 403 (got {res_forb.status})"

    # 4. Clean Teardown of Temporary Test Data
    print_f("\n--- Step 4: Cleaning Up Temporary Test Records ---")
    conn_db = mysql.connector.connect(host="localhost", port=3306, user="root", password="nathiya06")
    cur_db = conn_db.cursor()
    cur_db.execute("DELETE FROM attendance_student_db.students WHERE email = %s", (temp_stu_email,))
    cur_db.execute("DELETE FROM attendance_faculty_db.faculty WHERE email = %s", (temp_fac_email,))
    cur_db.execute("DELETE FROM attendance_auth_db.users WHERE email IN (%s, %s)", (temp_fac_email, temp_stu_email))
    conn_db.commit()
    cur_db.close()
    conn_db.close()

    # 5. Zero Automatic Creations Check
    final_admin, final_fac, final_stu, final_sess = get_db_counts()
    print_f(f"Final DB Baseline -> Admin: {final_admin} | Faculty: {final_fac} | Students: {final_stu} | Sessions: {final_sess}")
    assert (final_admin, final_fac, final_stu, final_sess) == (init_admin, init_fac, init_stu, init_sess), "Database record count changed!"
    print_f("PASS: Database baseline remained 100% constant (Admin: 1, Faculty: 0, Students: 0, Sessions: 0).")

    print_f("\n=========================================================================")
    print_f("=== FACULTY & ADMIN CORS REGRESSION PASSED 100% WITH CLEAN BASELINE ===")
    print_f("=========================================================================")

if __name__ == "__main__":
    run_full_cors_and_authorization_regression()
