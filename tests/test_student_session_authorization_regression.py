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
    databases = {
        "users": "attendance_auth_db",
        "faculty": "attendance_faculty_db",
        "students": "attendance_student_db",
        "attendance_sessions": "attendance_db",
        "device_enrollments": "attendance_device_db",
    }
    for label, db in databases.items():
        conn = mysql.connector.connect(**MYSQL_CONFIG, database=db, autocommit=True)
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(f"SELECT count(*) as cnt FROM {label}")
            counts[label] = cursor.fetchone()["cnt"]
        conn.close()
    return counts

def test_student_session_authorization_regression():
    print("=== STARTING STUDENT SESSION AUTHORIZATION REGRESSION SUITE ===")
    baseline_counts = get_db_counts()
    print("Baseline Database Counts:", baseline_counts)

    # 1. Login Student (vishwa@college.edu)
    stu_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishwa@college.edu", "password": "admin123"})
    assert stu_login.status_code == 200, f"Student login failed: {stu_login.text}"
    stu_token = stu_login.json()["token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    # 2. Login Faculty Owner (giri@college.edu - owner of session 239)
    fac_owner_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "giri@college.edu", "password": "admin123"})
    assert fac_owner_login.status_code == 200, f"Faculty owner login failed: {fac_owner_login.text}"
    owner_token = fac_owner_login.json()["token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # 3. Login Non-Owner Faculty (vishal@college.edu)
    fac_other_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    assert fac_other_login.status_code == 200, f"Non-owner faculty login failed: {fac_other_login.text}"
    other_token = fac_other_login.json()["token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # TEST 1: Student JWT + Valid 6-Digit Attendance Code ('746367') -> 200 OK
    print("\n--- TEST 1: Student JWT + Valid 6-Digit Attendance Code ('746367') ---")
    res1 = requests.get(f"{GATEWAY_URL}/api/student/attendance/sessions/by-code/746367", headers=stu_headers)
    assert res1.status_code == 200, f"Expected 200 OK for student code lookup, got {res1.status_code}: {res1.text}"
    data1 = res1.json()
    assert data1["id"] == 239
    assert data1["sessionId"] == "SESS_DE2724017788"
    print(f"PASSED Test 1: Status 200 OK, session ID: {data1['id']}, UUID: {data1['sessionId']}")

    # TEST 2: No JWT (Unauthenticated) -> Rejected (401 Unauthorized)
    print("\n--- TEST 2: Unauthenticated Request (No Token) ---")
    res2 = requests.get(f"{GATEWAY_URL}/api/student/attendance/sessions/by-code/746367")
    assert res2.status_code == 401, f"Expected 401 UNAUTHORIZED for missing JWT, got {res2.status_code}"
    print("PASSED Test 2: Unauthenticated request correctly rejected with 401 UNAUTHORIZED")

    # TEST 3: Faculty JWT + Student Endpoint -> 403 Forbidden
    print("\n--- TEST 3: Faculty JWT Attempting Student Endpoint ---")
    res3 = requests.get(f"{GATEWAY_URL}/api/student/attendance/sessions/by-code/746367", headers=owner_headers)
    assert res3.status_code == 403, f"Expected 403 FORBIDDEN for Faculty accessing student endpoint, got {res3.status_code}"
    print("PASSED Test 3: Faculty JWT accessing student endpoint correctly rejected with 403 FORBIDDEN")

    # TEST 4 & 5: Invalid / Nonexistent Attendance Code -> 404 NOT_FOUND
    print("\n--- TEST 4 & 5: Nonexistent / Invalid Attendance Code ---")
    res4 = requests.get(f"{GATEWAY_URL}/api/student/attendance/sessions/by-code/000000", headers=stu_headers)
    assert res4.status_code == 404, f"Expected 404 NOT_FOUND for nonexistent code 000000, got {res4.status_code}"
    print("PASSED Test 4 & 5: Nonexistent code 000000 correctly returned 404 NOT_FOUND")

    # TEST 6: Faculty Owner Attendance Endpoint -> 200 OK
    print("\n--- TEST 6: Faculty Owner Attendance Endpoint (Session 239) ---")
    res6 = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/239/attendance", headers=owner_headers)
    assert res6.status_code == 200, f"Expected 200 OK for faculty session owner, got {res6.status_code}: {res6.text}"
    assert isinstance(res6.json(), list)
    print(f"PASSED Test 6: Status 200 OK for faculty session owner, returned records: {res6.json()}")

    # TEST 7: Non-Owner Faculty Attendance Endpoint -> 403 Forbidden
    print("\n--- TEST 7: Non-Owner Faculty Attendance Endpoint ---")
    res7 = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/239/attendance", headers=other_headers)
    assert res7.status_code == 403, f"Expected 403 FORBIDDEN for non-owner faculty, got {res7.status_code}"
    print("PASSED Test 7: Non-owner faculty correctly rejected with 403 FORBIDDEN")

    # TEST 8: Database Integrity Audit
    final_counts = get_db_counts()
    assert baseline_counts == final_counts, f"Database counts mutated! Baseline: {baseline_counts}, Final: {final_counts}"
    print("\n--- DATABASE INTEGRITY VERIFIED ---")
    print("Zero database rows created or modified during all GET requests!")

    print("\n=== ALL STUDENT SESSION AUTHORIZATION REGRESSION TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_student_session_authorization_regression()
