import http.client
import json
import mysql.connector

def print_f(*args, **kwargs):
    print(*args, **kwargs, flush=True)

def get_db_counts():
    conn = mysql.connector.connect(host="localhost", port=3306, user="root", password="nathiya06")
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_auth_db.users WHERE role = 'ADMIN'")
    admin_users = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_auth_db.users WHERE role = 'FACULTY'")
    fac_users = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_auth_db.users WHERE role = 'STUDENT'")
    stu_users = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_faculty_db.faculty")
    fac_profiles = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_student_db.students")
    stu_profiles = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_db.attendance_sessions")
    sess_cnt = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_student_db.face_enrollments")
    face_cnt = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_student_db.device_enrollments")
    stu_dev_cnt = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM attendance_device_db.device_enrollments")
    dev_dev_cnt = cur.fetchone()["cnt"]

    cur.close()
    conn.close()
    return admin_users, fac_users, stu_users, fac_profiles, stu_profiles, sess_cnt, face_cnt, stu_dev_cnt + dev_dev_cnt

def run_clean_baseline_test():
    print_f("=========================================================================")
    print_f("=== CLEAN BASELINE & ZERO AUTOMATIC RECORD CREATION TEST ===")
    print_f("=========================================================================")

    # 1. Verify Clean Baseline Database State
    a_u, f_u, s_u, f_p, s_p, sess, face, dev = get_db_counts()
    print_f(f"Initial State -> Admin: {a_u} | Faculty Users: {f_u} | Student Users: {s_u} | Faculty Profiles: {f_p} | Student Profiles: {s_p} | Sessions: {sess}")

    assert a_u == 1, f"Expected 1 Admin user, got {a_u}"
    assert f_u == 0 and f_p == 0, f"Expected 0 Faculty users/profiles, got {f_u}/{f_p}"
    assert s_u == 0 and s_p == 0, f"Expected 0 Student users/profiles, got {s_u}/{s_p}"
    assert sess == 0, f"Expected 0 Sessions, got {sess}"
    assert face == 0 and dev == 0, f"Expected 0 Enrollments, got face={face}, dev={dev}"

    print_f("PASS: Database baseline is 100% clean (Admin: 1, Faculty: 0, Students: 0, Sessions: 0, Enrollments: 0).")

    # 2. Authenticate Admin
    conn = http.client.HTTPConnection("localhost", 8081)
    conn.request("POST", "/api/auth/login", json.dumps({"email": "admin@college.edu", "password": "admin123"}), {"Content-Type": "application/json"})
    res = conn.getresponse()
    raw = res.read().decode()
    assert res.status == 200, f"Admin login failed: {raw}"
    admin_token = json.loads(raw)["token"]
    admin_headers = {"Authorization": "Bearer " + admin_token, "Content-Type": "application/json"}
    print_f("PASS: Admin (admin@college.edu) logged in successfully.")

    # 3. Perform 10 Navigation Iterations across Admin Dashboard APIs
    endpoints = [
        "/api/admin/metrics",
        "/api/admin/activities",
        "/api/admin/fraud",
        "/api/admin/students",
        "/api/admin/faculty",
        "/api/admin/subjects",
        "/api/admin/settings",
        "/api/admin/profile"
    ]

    for iteration in range(1, 11):
        for ep in endpoints:
            conn.request("GET", ep, headers=admin_headers)
            res_get = conn.getresponse()
            res_get.read()
            assert res_get.status == 200, f"GET {ep} failed with status {res_get.status} on iteration {iteration}"

    # 4. Verify Database State Remained 100% Constant
    a_u2, f_u2, s_u2, f_p2, s_p2, sess2, face2, dev2 = get_db_counts()
    print_f(f"Post-Navigation State -> Admin: {a_u2} | Faculty: {f_u2} | Students: {s_u2} | Sessions: {sess2}")

    assert (a_u2, f_u2, s_u2, f_p2, s_p2, sess2, face2, dev2) == (a_u, f_u, s_u, f_p, s_p, sess, face, dev), "Database counts changed during Admin navigation!"

    print_f("PASS: 10 navigation iterations across Admin dashboard created 0 automatic records.")

    print_f("\n=========================================================================")
    print_f("=== CLEAN BASELINE VERIFICATION PASSED 100% WITH ZERO CREATIONS ===")
    print_f("=========================================================================")

if __name__ == "__main__":
    run_clean_baseline_test()
