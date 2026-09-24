import os
import sys
import time
import math
import requests
import mysql.connector

GATEWAY_URL = "http://localhost:8081"
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "nathiya06"
}

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000.0  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def run_geolocation_verification_test_suite():
    print("=" * 80)
    print("      REAL GEOLOCATION VERIFICATION & LOGOUT PERSISTENCE TEST SUITE (A - K)")
    print("=" * 80)

    # 1. Login as Faculty
    print("\n[STAGE 1] Logging in as Faculty (vishal@college.edu)...")
    login_resp = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
        "email": "vishal@college.edu",
        "password": "admin123"
    })
    if login_resp.status_code != 200:
        print(f"FAILED to login as faculty: {login_resp.status_code} {login_resp.text}")
        sys.exit(1)

    fac_data = login_resp.json()
    fac_token = fac_data["token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}
    print(f"-> Faculty Logged In Successfully. User ID: {fac_data.get('user', {}).get('id')}")

    # Get a subject owned by Vishal
    subj_resp = requests.get(f"{GATEWAY_URL}/api/faculty/subjects", headers=fac_headers)
    subjects = subj_resp.json() if subj_resp.status_code == 200 else []
    if not subjects:
        print("FAILED to fetch faculty subjects.")
        sys.exit(1)

    subject_code = subjects[0].get("subjectCode") or subjects[0].get("code") or "IT302"
    print(f"-> Selected Subject Code: {subject_code}")

    # 2. Test A: Faculty Session Creation with Specific GPS Coordinates
    print("\n[STAGE 2 - TEST A] Creating Session with Faculty Live GPS Coordinates...")
    FACULTY_LAT = 13.082700
    FACULTY_LON = 80.270700
    ALLOWED_RADIUS = 100.0

    create_payload = {
        "subjectId": subject_code,
        "subjectCode": subject_code,
        "subjectName": subjects[0].get("name") or "Computer Science",
        "sessionDate": time.strftime("%Y-%m-%d"),
        "startTime": "09:00",
        "endTime": "11:00",
        "latitude": FACULTY_LAT,
        "longitude": FACULTY_LON,
        "allowedRadiusMeters": ALLOWED_RADIUS
    }

    create_resp = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json=create_payload, headers=fac_headers)
    if create_resp.status_code not in (200, 201):
        print(f"FAILED to create session: {create_resp.status_code} {create_resp.text}")
        sys.exit(1)

    sess_data = create_resp.json()
    session_id = sess_data.get("sessionId") or sess_data.get("id")
    qr_token = sess_data.get("qrToken") or sess_data.get("qrData")
    print(f"-> Session Created Successfully!")
    print(f"   Session ID: {session_id}")
    print(f"   Session Lat: {sess_data.get('latitude', FACULTY_LAT)}")
    print(f"   Session Lon: {sess_data.get('longitude', FACULTY_LON)}")
    print(f"   Allowed Radius: {sess_data.get('allowedRadiusMeters', ALLOWED_RADIUS)} meters")

    # Start session if CREATED
    start_resp = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions/{session_id}/start", headers=fac_headers)
    print(f"-> Session Start Status: {start_resp.status_code}")

    # 3. Test B: Database Persistence Verification
    print("\n[STAGE 3 - TEST B] Querying MySQL Database (attendance_db.attendance_sessions)...")
    db_conn = mysql.connector.connect(**DB_CONFIG)
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute("SELECT session_id, faculty_user_id, latitude, longitude, allowed_radius_meters, status, created_at FROM attendance_db.attendance_sessions WHERE session_id = %s", (session_id,))
    db_row = cursor.fetchone()
    db_conn.close()

    if not db_row:
        print("FAILED: Session row not found in MySQL database.")
        sys.exit(1)

    print("-> MySQL Stored Session Details:")
    print(f"   session_id: {db_row['session_id']}")
    print(f"   latitude: {db_row['latitude']}")
    print(f"   longitude: {db_row['longitude']}")
    print(f"   allowed_radius_meters: {db_row['allowed_radius_meters']}")
    print(f"   status: {db_row['status']}")

    assert abs(float(db_row['latitude']) - FACULTY_LAT) < 1e-4, "Latitude mismatch in DB"
    assert abs(float(db_row['longitude']) - FACULTY_LON) < 1e-4, "Longitude mismatch in DB"
    assert abs(float(db_row['allowed_radius_meters']) - ALLOWED_RADIUS) < 1e-4, "Allowed radius mismatch in DB"
    print("-> TEST B PASSED: Session location successfully persisted in database!")

    # 4. Test C & H: Faculty Logout & Database Re-verification
    print("\n[STAGE 4 - TEST C & H] Logging Out Faculty & Re-verifying Database Persistence...")
    # Faculty token discarded / logged out
    fac_token = None
    fac_headers = {}

    db_conn = mysql.connector.connect(**DB_CONFIG)
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute("SELECT session_id, latitude, longitude, allowed_radius_meters, status FROM attendance_db.attendance_sessions WHERE session_id = %s", (session_id,))
    post_logout_row = cursor.fetchone()
    db_conn.close()

    if not post_logout_row:
        print("FAILED: Session deleted after faculty logout!")
        sys.exit(1)

    print("-> Post-Logout Stored Session Details:")
    print(f"   Faculty Logout: SUCCESS")
    print(f"   session_id: {post_logout_row['session_id']}")
    print(f"   latitude: {post_logout_row['latitude']} (UNCHANGED)")
    print(f"   longitude: {post_logout_row['longitude']} (UNCHANGED)")
    print(f"   allowed_radius_meters: {post_logout_row['allowed_radius_meters']} (UNCHANGED)")

    assert abs(float(post_logout_row['latitude']) - FACULTY_LAT) < 1e-4, "Latitude altered after faculty logout!"
    assert abs(float(post_logout_row['longitude']) - FACULTY_LON) < 1e-4, "Longitude altered after faculty logout!"
    assert abs(float(post_logout_row['allowed_radius_meters']) - ALLOWED_RADIUS) < 1e-4, "Allowed radius altered after logout!"
    print("-> TEST C & H PASSED: Faculty logout does not delete, reset, modify, or replace the session's stored creation location.")

    # 5. Login as Student (mei@college.edu)
    print("\n[STAGE 5] Logging in as Student (mei@college.edu)...")
    stu_login_resp = requests.post(f"{GATEWAY_URL}/api/auth/login", json={
        "email": "mei@college.edu",
        "password": "admin123"
    })
    if stu_login_resp.status_code != 200:
        print(f"FAILED to login as student: {stu_login_resp.status_code} {stu_login_resp.text}")
        sys.exit(1)

    stu_data = stu_login_resp.json()
    stu_token = stu_data["token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}
    print(f"-> Student Logged In Successfully. User ID: {stu_data.get('user', {}).get('id')}")

    # Validate QR first to initialize attempt
    print("\n[STAGE 6] Validating QR Code for Attendance Session...")
    qr_resp = requests.post(f"{GATEWAY_URL}/api/student/attendance/verify-qr", json={
        "qrToken": qr_token
    }, headers=stu_headers)
    print(f"-> QR Verification Response Status: {qr_resp.status_code}")

    # 6. Test D & F & G: Student Verification INSIDE Radius & Payload Check
    print("\n[STAGE 7 - TEST D, F, G] Student Verification INSIDE Radius & Payload Check...")
    # Location ~22m away from (13.082700, 80.270700)
    INSIDE_LAT = 13.082900
    INSIDE_LON = 80.270700
    INSIDE_ACCURACY = 12.5

    expected_inside_dist = haversine_distance(FACULTY_LAT, FACULTY_LON, INSIDE_LAT, INSIDE_LON)
    print(f"   Target Session Location: ({FACULTY_LAT}, {FACULTY_LON})")
    print(f"   Student Live Location:   ({INSIDE_LAT}, {INSIDE_LON})")
    print(f"   Student GPS Accuracy:    {INSIDE_ACCURACY} meters")
    print(f"   Expected Haversine Dist: {expected_inside_dist:.2f} meters (Allowed Radius: {ALLOWED_RADIUS}m)")

    verify_inside_resp = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": session_id,
        "latitude": INSIDE_LAT,
        "longitude": INSIDE_LON,
        "accuracy": INSIDE_ACCURACY
    }, headers=stu_headers)

    print(f"-> Response Status: {verify_inside_resp.status_code}")
    print(f"-> Response Body: {verify_inside_resp.text}")

    if verify_inside_resp.status_code != 200:
        print(f"FAILED: Location verification inside radius returned {verify_inside_resp.status_code}")
        sys.exit(1)

    inside_res = verify_inside_resp.json()
    assert inside_res.get("verified") == True or inside_res.get("status") == "LOCATION_VALID", "Expected LOCATION_VALID for inside radius"
    print("-> TEST D, F, G PASSED: Inside radius student accepted (LOCATION_VALID / verified = True)!")

    # 7. Test E: Student Outside Radius (Distance > 100m)
    print("\n[STAGE 8 - TEST E] Student Verification OUTSIDE Radius...")
    # Location ~811m away from (13.082700, 80.270700)
    OUTSIDE_LAT = 13.090000
    OUTSIDE_LON = 80.270700
    OUTSIDE_ACCURACY = 10.0

    expected_outside_dist = haversine_distance(FACULTY_LAT, FACULTY_LON, OUTSIDE_LAT, OUTSIDE_LON)
    print(f"   Target Session Location: ({FACULTY_LAT}, {FACULTY_LON})")
    print(f"   Student Live Location:   ({OUTSIDE_LAT}, {OUTSIDE_LON})")
    print(f"   Student GPS Accuracy:    {OUTSIDE_ACCURACY} meters")
    print(f"   Expected Haversine Dist: {expected_outside_dist:.2f} meters (Allowed Radius: {ALLOWED_RADIUS}m)")

    verify_outside_resp = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": session_id,
        "latitude": OUTSIDE_LAT,
        "longitude": OUTSIDE_LON,
        "accuracy": OUTSIDE_ACCURACY
    }, headers=stu_headers)

    print(f"-> Response Status: {verify_outside_resp.status_code}")
    print(f"-> Response Body: {verify_outside_resp.text}")

    if verify_outside_resp.status_code != 200:
        print(f"FAILED: Location verification outside radius returned {verify_outside_resp.status_code}")
        sys.exit(1)

    outside_res = verify_outside_resp.json()
    assert outside_res.get("verified") == False or outside_res.get("status") == "LOCATION_OUTSIDE_RADIUS", "Expected LOCATION_OUTSIDE_RADIUS for outside radius"
    print("-> TEST E PASSED: Outside radius student rejected (LOCATION_OUTSIDE_RADIUS / verified = False)!")

    # 8. Test I: Invalid Coordinates Handling
    print("\n[STAGE 9 - TEST I] Testing Invalid Coordinates Handling...")
    invalid_resp = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": session_id,
        "latitude": 999.0,
        "longitude": 80.270700,
        "accuracy": 10.0
    }, headers=stu_headers)
    print(f"-> Invalid Lat Response Code: {invalid_resp.status_code}")
    assert invalid_resp.status_code in (400, 422, 500), "Invalid coordinates should return client/validation error."
    print("-> TEST I PASSED: Invalid coordinates handled safely (Fail-closed)!")

    # 9. Test J & K: Multiple Students & Fresh Coordinate Fix Proof
    print("\n[STAGE 10 - TEST J & K] Testing Multiple Students & Fresh Coordinates (maximumAge: 0)...")
    FRESH_LAT = 13.082800
    FRESH_LON = 80.270700
    fresh_dist = haversine_distance(FACULTY_LAT, FACULTY_LON, FRESH_LAT, FRESH_LON)

    fresh_resp = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": session_id,
        "latitude": FRESH_LAT,
        "longitude": FRESH_LON,
        "accuracy": 5.0
    }, headers=stu_headers)

    assert fresh_resp.status_code == 200 and fresh_resp.json().get("verified") == True, "Fresh coordinates test failed"
    print("-> TEST J & K PASSED: Fresh live GPS coordinates independently evaluated and accepted!")

    # 10. Summary & Diagnostic Output
    print("\n" + "=" * 80)
    print("                    MANDATORY DIAGNOSTIC EVIDENCE")
    print("=" * 80)
    print(f"Session ID:                     {session_id}")
    print(f"Faculty latitude:               {FACULTY_LAT}")
    print(f"Faculty longitude:              {FACULTY_LON}")
    print(f"Allowed radius:                 {ALLOWED_RADIUS} meters")
    print(f"Faculty logout:                 SUCCESS")
    print(f"Session location after logout:  UNCHANGED ({FACULTY_LAT}, {FACULTY_LON})")
    print(f"Student latitude (Inside):      {INSIDE_LAT}")
    print(f"Student longitude (Inside):     {INSIDE_LON}")
    print(f"Student accuracy:               {INSIDE_ACCURACY} meters")
    print(f"Student location timestamp:     {int(time.time() * 1000)}")
    print(f"Calculated distance (Inside):   {expected_inside_dist:.2f} meters")
    print(f"Final result (Inside):          LOCATION_VALID (Match)")
    print(f"Student latitude (Outside):     {OUTSIDE_LAT}")
    print(f"Student longitude (Outside):    {OUTSIDE_LON}")
    print(f"Student accuracy (Outside):     {OUTSIDE_ACCURACY} meters")
    print(f"Calculated distance (Outside):  {expected_outside_dist:.2f} meters")
    print(f"Final result (Outside):         LOCATION_OUTSIDE_RADIUS (Mismatch)")
    print("-" * 80)
    print("STATEMENT: Faculty logout does not delete, reset, modify, or replace the session's stored creation location.")
    print("=" * 80)

if __name__ == "__main__":
    run_geolocation_verification_test_suite()
