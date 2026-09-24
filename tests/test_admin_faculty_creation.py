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
    conn_fac = mysql.connector.connect(**MYSQL_CONFIG, database="attendance_faculty_db", autocommit=True)

    with conn_auth.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT id, email, role FROM users")
        auth_users = {u["email"].lower(): u for u in cursor.fetchall()}

    with conn_fac.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT id, user_id, email FROM faculty")
        fac_records = {f["email"].lower(): f for f in cursor.fetchall()}

    conn_auth.close()
    conn_fac.close()

    orphans_auth = [u for e, u in auth_users.items() if u["role"] == "FACULTY" and e not in fac_records]
    orphans_fac = [f for e, f in fac_records.items() if e not in auth_users]

    return len(orphans_auth) + len(orphans_fac)

def test_admin_faculty_creation():
    print("=== STARTING PERMANENT ADMIN FACULTY CREATION REGRESSION SUITE ===")
    ts = int(time.time())

    # 1. Admin login -> 200
    admin_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    print("1. Admin Login -> 200 OK")

    # 2. Create unique Faculty -> 201 Created
    unique_email = f"fac_uniq_{ts}@college.edu"
    unique_emp_id = f"EMP_UNIQ_{ts}"
    unique_name = f"Prof. Unique Tester {ts}"

    counts_before = get_db_counts()

    create_res = requests.post(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers, json={
        "email": unique_email,
        "employeeId": unique_emp_id,
        "fullName": unique_name,
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering",
        "designation": "Professor"
    })
    assert create_res.status_code in (200, 201), f"Faculty creation failed: {create_res.text}"
    created_data = create_res.json()
    print("2. Create Unique Faculty -> 201 Created:", created_data.get("id") or created_data.get("faculty", {}).get("id"))

    # 3 & 4. Verify exactly +1 auth user and +1 faculty profile
    counts_after = get_db_counts()
    assert counts_after["attendance_auth_db"] == counts_before["attendance_auth_db"] + 1, "Auth users count did not increase by 1"
    assert counts_after["attendance_faculty_db"] == counts_before["attendance_faculty_db"] + 1, "Faculty profiles count did not increase by 1"
    print("3 & 4. DB record counts verified (+1 Auth User, +1 Faculty Profile)")

    # 5 & 6. GET Faculty list -> newly created Faculty exists across refreshes
    list_res1 = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers)
    assert list_res1.status_code == 200
    found1 = any(f.get("email") == unique_email for f in list_res1.json())
    assert found1, "Newly created faculty not found in list!"

    list_res2 = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers)
    assert list_res2.status_code == 200
    found2 = any(f.get("email") == unique_email for f in list_res2.json())
    assert found2, "Faculty missing on list refresh!"
    print("5 & 6. Faculty visibility verified across list calls")

    # 7. Attempt same email again -> 409 Conflict
    dup_email_res = requests.post(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers, json={
        "email": unique_email,
        "employeeId": f"EMP_OTHER_{ts}",
        "fullName": "Duplicate Email Attempt",
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert dup_email_res.status_code == 409, f"Expected 409 Conflict for duplicate email, got {dup_email_res.status_code}"
    print("7. Duplicate email attempt -> 409 Conflict verified")

    # 8. Attempt same employee ID again -> 409 Conflict
    dup_emp_res = requests.post(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers, json={
        "email": f"other_email_{ts}@college.edu",
        "employeeId": unique_emp_id,
        "fullName": "Duplicate Employee ID Attempt",
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert dup_emp_res.status_code == 409, f"Expected 409 Conflict for duplicate employee ID, got {dup_emp_res.status_code}"
    print("8. Duplicate employee ID attempt -> 409 Conflict verified")

    # 9 & 10. Verify duplicate attempts created zero extra records and zero orphans
    assert get_db_counts() == counts_after, "Duplicate attempts mutated DB counts!"
    assert check_orphans() == 0, "Orphan records detected in DB!"
    print("9 & 10. Zero extra records and zero orphans verified")

    # 11. Verify Student creation still works
    fac_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    assert fac_login.status_code == 200
    fac_token = fac_login.json()["token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}", "Content-Type": "application/json"}

    stu_create_res = requests.post(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers, json={
        "email": f"stu_check_{ts}@college.edu",
        "studentId": f"STU_CHK_{ts}",
        "fullName": f"Student Check {ts}",
        "password": "TestPassword123!",
        "department": "Computer Science & Engineering"
    })
    assert stu_create_res.status_code in (200, 201), f"Student creation failed: {stu_create_res.text}"
    print("11. Student creation verified working")

    # 12. Verify Admin authorization remains protected
    stu_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishwa@college.edu", "password": "admin123"})
    stu_token = stu_login.json()["token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    forbidden_fac = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=stu_headers)
    assert forbidden_fac.status_code == 403, f"Expected 403 for Student calling admin endpoint, got {forbidden_fac.status_code}"
    print("12. Admin authorization protections verified")

    # 13. Verify CORS/preflight still works
    preflight_res = requests.options(f"{GATEWAY_URL}/api/admin/faculty", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type"
    })
    assert preflight_res.status_code == 200
    assert preflight_res.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"
    print("13. CORS preflight verified")

    print("\n=== ALL FACULTY CREATION, TRANSACTIONAL INTEGRITY, AND AUTHORIZATION TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_admin_faculty_creation()
