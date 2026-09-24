import http.client
import json
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

def run_admin_dashboard_regression_test():
    print_f("=========================================================================")
    print_f("=== REGRESSION TEST: ADMIN DASHBOARD NAVIGATION & ZERO CREATIONS ===")
    print_f("=========================================================================")

    conn = http.client.HTTPConnection("localhost", 8081)

    init_admin, init_fac, init_stu, init_sess = get_db_counts()
    print_f(f"Initial State -> Admin: {init_admin} | Faculty: {init_fac} | Students: {init_stu} | Sessions: {init_sess}")

    # Admin Login
    conn.request("POST", "/api/auth/login", json.dumps({"email": "admin@college.edu", "password": "admin123"}), {"Content-Type": "application/json"})
    res = conn.getresponse()
    raw_login = res.read().decode()
    assert res.status == 200, f"Admin login failed: {raw_login}"
    token = json.loads(raw_login)["token"]
    headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}

    admin_routes = [
        "/api/admin/metrics",
        "/api/admin/activities",
        "/api/admin/fraud",
        "/api/admin/students",
        "/api/admin/faculty",
        "/api/admin/subjects",
        "/api/admin/settings",
        "/api/admin/profile"
    ]

    # Perform 5 navigation iterations across all Admin Dashboard endpoints
    for iteration in range(1, 6):
        print_f(f"Navigation Iteration {iteration}...")
        for ep in admin_routes:
            # OPTIONS preflight
            conn.request("OPTIONS", ep, headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            })
            res_opt = conn.getresponse()
            res_opt.read()
            assert res_opt.status in (200, 204), f"Preflight OPTIONS failed for {ep} on iteration {iteration}"

            # GET request
            conn.request("GET", ep, headers=headers)
            res_get = conn.getresponse()
            data_get = res_get.read().decode()
            assert res_get.status == 200, f"GET {ep} failed with status {res_get.status} on iteration {iteration}: {data_get}"

    final_admin, final_fac, final_stu, final_sess = get_db_counts()
    print_f(f"Final State   -> Admin: {final_admin} | Faculty: {final_fac} | Students: {final_stu} | Sessions: {final_sess}")

    assert (final_admin, final_fac, final_stu, final_sess) == (init_admin, init_fac, init_stu, init_sess), "Database record count changed during Admin dashboard navigation!"

    print_f("\n=========================================================================")
    print_f("=== REGRESSION TEST PASSED 100%: 0 CORS FAILURES & 0 AUTO CREATIONS ===")
    print_f("=========================================================================")

if __name__ == "__main__":
    run_admin_dashboard_regression_test()
