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

def test_admin_faculty_student_visibility():
    print("=== STARTING ADMIN FACULTY & STUDENT VISIBILITY REGRESSION SUITE ===")

    ts = int(time.time())

    # 1. Login Admin
    admin_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # ==========================================
    # TEST A — ADMIN FACULTY VISIBILITY
    # ==========================================
    print("\n--- TEST A: Admin Faculty Visibility ---")
    counts_before_fac = get_db_counts()

    new_fac_email = f"vis_test_fac_{ts}@college.edu"
    new_fac_emp_id = f"EMP_VIS_{ts}"
    new_fac_name = f"Dr. Visibility Tester {ts}"

    create_fac_res = requests.post(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers, json={
        "email": new_fac_email,
        "employeeId": new_fac_emp_id,
        "fullName": new_fac_name,
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering",
        "designation": "Associate Professor",
        "phone": "+91 9876543210"
    })
    assert create_fac_res.status_code in (200, 201), f"Faculty creation failed: {create_fac_res.text}"
    created_fac = create_fac_res.json()
    print(f"Created Faculty ID: {created_fac.get('id')}, email: {new_fac_email}")

    counts_after_fac = get_db_counts()
    assert counts_after_fac["attendance_auth_db"] == counts_before_fac["attendance_auth_db"] + 1, "Auth users count did not increase by 1"
    assert counts_after_fac["attendance_faculty_db"] == counts_before_fac["attendance_faculty_db"] + 1, "Faculty profiles count did not increase by 1"

    # Call Admin Faculty List
    fac_list_res1 = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers)
    assert fac_list_res1.status_code == 200
    fac_list1 = fac_list_res1.json()
    found_fac = any(f.get("email") == new_fac_email or f.get("employeeId") == new_fac_emp_id for f in fac_list1)
    assert found_fac, f"Newly created Faculty {new_fac_email} not found in Admin Faculty list!"

    # Relogin Admin and check again
    admin_login2 = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    admin_token2 = admin_login2.json()["token"]
    admin_headers2 = {"Authorization": f"Bearer {admin_token2}"}

    fac_list_res2 = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers2)
    assert fac_list_res2.status_code == 200
    found_fac_after_relogin = any(f.get("email") == new_fac_email for f in fac_list_res2.json())
    assert found_fac_after_relogin, "Faculty disappeared after Admin relogin!"

    # 10x Refresh audit
    for _ in range(10):
        r = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers2)
        assert r.status_code == 200

    assert get_db_counts() == counts_after_fac, "Database counts changed during 10x refresh audit!"
    print("Test A PASSED 100%")

    # ==========================================
    # TEST B — ADMIN STUDENT VISIBILITY
    # ==========================================
    print("\n--- TEST B: Admin Student Visibility ---")

    # Login as Faculty (using created faculty or existing faculty)
    fac_user_email = "vishal@college.edu"
    fac_user_pass = "admin123"
    fac_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": fac_user_email, "password": fac_user_pass})
    assert fac_login_res.status_code == 200, f"Faculty login failed: {fac_login_res.text}"
    fac_token = fac_login_res.json()["token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    counts_before_stu = get_db_counts()

    new_stu_email = f"vis_test_stu_{ts}@college.edu"
    new_stu_id = f"STU_VIS_{ts}"
    new_stu_name = f"Student Visibility Tester {ts}"

    create_stu_res = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": new_stu_email,
        "studentId": new_stu_id,
        "fullName": new_stu_name,
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert create_stu_res.status_code in (200, 201), f"Student creation failed: {create_stu_res.text}"
    created_stu = create_stu_res.json()
    print(f"Created Student ID: {created_stu.get('id')}, email: {new_stu_email}")

    counts_after_stu = get_db_counts()
    assert counts_after_stu["attendance_auth_db"] == counts_before_stu["attendance_auth_db"] + 1, "Auth users count did not increase by 1"
    assert counts_after_stu["attendance_student_db"] == counts_before_stu["attendance_student_db"] + 1, "Student profiles count did not increase by 1"

    # Call Admin Student List
    stu_list_res1 = requests.get(f"{GATEWAY_URL}/api/admin/students", headers=admin_headers2)
    assert stu_list_res1.status_code == 200
    stu_list1 = stu_list_res1.json()
    found_stu = any(s.get("email") == new_stu_email or s.get("studentId") == new_stu_id or s.get("rollNumber") == new_stu_id for s in stu_list1)
    assert found_stu, f"Newly created Student {new_stu_email} not found in Admin Student list!"

    # Relogin Admin and check again
    admin_login3 = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    admin_token3 = admin_login3.json()["token"]
    admin_headers3 = {"Authorization": f"Bearer {admin_token3}"}

    stu_list_res2 = requests.get(f"{GATEWAY_URL}/api/admin/students", headers=admin_headers3)
    assert stu_list_res2.status_code == 200
    found_stu_after_relogin = any(s.get("email") == new_stu_email for s in stu_list_res2.json())
    assert found_stu_after_relogin, "Student disappeared after Admin relogin!"

    # 10x Refresh audit
    for _ in range(10):
        r = requests.get(f"{GATEWAY_URL}/api/admin/students", headers=admin_headers3)
        assert r.status_code == 200

    assert get_db_counts() == counts_after_stu, "Database counts changed during 10x refresh audit!"
    print("Test B PASSED 100%")

    # ==========================================
    # TEST C — AUTHORIZATION
    # ==========================================
    print("\n--- TEST C: Authorization Checks ---")
    # Faculty JWT calling Admin endpoints
    fac_fac_res = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=fac_headers)
    assert fac_fac_res.status_code == 403, f"Expected 403 for Faculty calling admin/faculty, got {fac_fac_res.status_code}"

    fac_stu_res = requests.get(f"{GATEWAY_URL}/api/admin/students", headers=fac_headers)
    assert fac_stu_res.status_code == 403, f"Expected 403 for Faculty calling admin/students, got {fac_stu_res.status_code}"

    # Student JWT calling Admin endpoints
    stu_login_res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishwa@college.edu", "password": "admin123"})
    assert stu_login_res.status_code == 200
    stu_token = stu_login_res.json()["token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    stu_fac_res = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=stu_headers)
    assert stu_fac_res.status_code == 403, f"Expected 403 for Student calling admin/faculty, got {stu_fac_res.status_code}"

    stu_stu_res = requests.get(f"{GATEWAY_URL}/api/admin/students", headers=stu_headers)
    assert stu_stu_res.status_code == 403, f"Expected 403 for Student calling admin/students, got {stu_stu_res.status_code}"

    print("Test C PASSED 100%")

    # ==========================================
    # TEST D — NO AUTOMATIC CREATION AUDIT
    # ==========================================
    print("\n--- TEST D: No Automatic Creation Audit ---")
    counts_before_audit = get_db_counts()

    # Simulate dashboard requests
    requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    requests.get(f"{GATEWAY_URL}/api/admin/metrics", headers=admin_headers3)
    requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers3)
    requests.get(f"{GATEWAY_URL}/api/admin/students", headers=admin_headers3)
    requests.get(f"{GATEWAY_URL}/api/faculty/subjects", headers=fac_headers)

    for _ in range(10):
        requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers3)
        requests.get(f"{GATEWAY_URL}/api/admin/students", headers=admin_headers3)

    counts_after_audit = get_db_counts()
    assert counts_before_audit == counts_after_audit, f"DB counts changed during zero auto creation audit! Before: {counts_before_audit}, After: {counts_after_audit}"
    print("Test D PASSED 100%")

    print("\n=== ALL ADMIN VISIBILITY, AUTHORIZATION, AND INTEGRITY TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_admin_faculty_student_visibility()
