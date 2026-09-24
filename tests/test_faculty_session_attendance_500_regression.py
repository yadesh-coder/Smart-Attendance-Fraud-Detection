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

def test_faculty_session_attendance_500_regression():
    print("=== STARTING FACULTY SESSION ATTENDANCE REGRESSION SUITE ===")

    # Record baseline database state
    baseline_counts = get_db_counts()

    # Login Faculty Owner (giri@college.edu - owner of session 235)
    fac_owner_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "giri@college.edu", "password": "admin123"})
    assert fac_owner_login.status_code == 200, f"Faculty owner login failed: {fac_owner_login.text}"
    owner_token = fac_owner_login.json()["token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # Login Other Faculty (vishal@college.edu - non-owner of session 235)
    fac_other_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    assert fac_other_login.status_code == 200, f"Other faculty login failed: {fac_other_login.text}"
    other_token = fac_other_login.json()["token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Login Student (vishwa@college.edu)
    stu_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishwa@college.edu", "password": "admin123"})
    assert stu_login.status_code == 200, f"Student login failed: {stu_login.text}"
    stu_token = stu_login.json()["token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    # Test A & B: Existing authorized faculty session (session 235) -> 200 OK with records list (or [] if no scans)
    print("\n--- TEST A & B: Authorized Faculty Session Lookup (Session 235) ---")
    res_a = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/235/attendance", headers=owner_headers)
    assert res_a.status_code == 200, f"Expected 200 OK, got {res_a.status_code}: {res_a.text}"
    records_a = res_a.json()
    assert isinstance(records_a, list), f"Expected list response, got {type(records_a)}"
    print(f"PASSED Test A & B: Status 200 OK, returned {len(records_a)} attendance records: {records_a}")

    # Also test resolution by session_id UUID string ('SESS_D5DB6C6A3FD9')
    res_uuid = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/SESS_D5DB6C6A3FD9/attendance", headers=owner_headers)
    assert res_uuid.status_code == 200, f"Expected 200 OK for UUID session_id, got {res_uuid.status_code}"
    print("PASSED Lookup by UUID session_id ('SESS_D5DB6C6A3FD9'): Status 200 OK")

    # Also test resolution by 6-digit attendance_code ('005561')
    res_code = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/005561/attendance", headers=owner_headers)
    assert res_code.status_code == 200, f"Expected 200 OK for 6-digit attendance code, got {res_code.status_code}"
    print("PASSED Lookup by 6-digit attendance_code ('005561'): Status 200 OK")

    # Test C: Nonexistent session -> 404 NOT_FOUND
    print("\n--- TEST C: Nonexistent Session Lookup ---")
    res_c = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/999999/attendance", headers=owner_headers)
    assert res_c.status_code == 404, f"Expected 404 NOT_FOUND for nonexistent session, got {res_c.status_code}: {res_c.text}"
    print("PASSED Test C: Status 404 NOT_FOUND (No 500 error)")

    # Test D: Different faculty accessing another faculty's session -> 403 FORBIDDEN
    print("\n--- TEST D: Un-owned Faculty Session Access ---")
    res_d = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/235/attendance", headers=other_headers)
    assert res_d.status_code == 403, f"Expected 403 FORBIDDEN for unauthorized faculty, got {res_d.status_code}: {res_d.text}"
    print("PASSED Test D: Status 403 FORBIDDEN for non-owner faculty")

    # Test E: Student attempting Faculty endpoint -> 403 FORBIDDEN & Invalid Session ID -> 404
    print("\n--- TEST E: Authorization Isolation & Invalid Session Identifier ---")
    res_e1 = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/235/attendance", headers=stu_headers)
    assert res_e1.status_code == 403, f"Expected 403 FORBIDDEN for Student accessing Faculty endpoint, got {res_e1.status_code}"
    print("PASSED Test E1: Student accessing Faculty endpoint correctly returns 403 FORBIDDEN")

    res_e2 = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/invalid_session_id_xyz/attendance", headers=owner_headers)
    assert res_e2.status_code == 404, f"Expected 404 NOT_FOUND for invalid session identifier, got {res_e2.status_code}"
    print("PASSED Test E2: Invalid session identifier correctly returns 404 NOT_FOUND (No 500 error)")

    # Test F: Student Session Join Lookup (ROLE_STUDENT)
    print("\n--- TEST F: Student Session Join Lookup ---")
    res_stu_join = requests.get(f"{GATEWAY_URL}/api/student/attendance/sessions/by-code/235", headers=stu_headers)
    assert res_stu_join.status_code == 200, f"Expected 200 OK for Student session lookup, got {res_stu_join.status_code}"
    assert res_stu_join.json()["id"] == 235
    print("PASSED Test F: Student lookup session by code/ID returned 200 OK")

    # Database Integrity Verification
    final_counts = get_db_counts()
    assert baseline_counts == final_counts, f"Database counts mutated! Baseline: {baseline_counts}, Final: {final_counts}"
    print("\n--- DATABASE INTEGRITY VERIFIED ---")
    print("Zero database rows created or modified during all GET requests!")

    print("\n=== ALL FACULTY SESSION ATTENDANCE REGRESSION TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_faculty_session_attendance_500_regression()
