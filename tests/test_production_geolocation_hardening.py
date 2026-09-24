import math, requests, time, uuid, mysql.connector, json, datetime

GATEWAY_URL = "http://localhost:8081"

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def offset_point(lat, lon, distance_m, bearing_deg=0.0):
    R = 6371000.0
    bearing = math.radians(bearing_deg)
    lat1 = math.radians(lat)
    lon1 = math.radians(lon)
    lat2 = math.asin(math.sin(lat1) * math.cos(distance_m / R) + math.cos(lat1) * math.sin(distance_m / R) * math.cos(bearing))
    lon2 = lon1 + math.atan2(math.sin(bearing) * math.sin(distance_m / R) * math.cos(lat1), math.cos(distance_m / R) - math.sin(lat1) * math.sin(lat2))
    return math.degrees(lat2), math.degrees(lon2)

def run_tests():
    print("================================================================================")
    print("RUNNING PRODUCTION GEOLOCATION HARDENING SUITE (TESTS A - AB)")
    print("================================================================================")

    # Login Users
    stu_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "362@college.edu", "password": "admin123"})
    assert stu_login.status_code == 200, f"Student login failed: {stu_login.text}"
    stu_token = stu_login.json()["token"]
    stu_user_id = stu_login.json()["user"]["id"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    fac_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    assert fac_login.status_code == 200, f"Faculty login failed: {fac_login.text}"
    fac_token = fac_login.json()["token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    passed_count = 0
    total_count = 28

    # --- FACULTY SESSION CREATION TESTS (A - N) ---
    base_lat, base_lon = 13.0827, 80.2707
    now_ms = int(time.time() * 1000)

    print("TEST A: GPS available -> Session created...")
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    resA = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": today_str, "startTime": "00:00", "endTime": "23:59",
        "latitude": base_lat, "longitude": base_lon, "locationAccuracyMeters": 10.0, "locationTimestamp": now_ms, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    if resA.status_code == 400 and "already exists" in resA.text:
        # Use alternate active time slot if already created
        resA = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
            "subjectId": "IT302", "sessionDate": today_str, "startTime": "00:01", "endTime": "23:58",
            "latitude": base_lat, "longitude": base_lon, "locationAccuracyMeters": 10.0, "locationTimestamp": now_ms, "allowedRadiusMeters": 100.0
        }, headers=fac_headers)
    assert resA.status_code in [200, 201], f"Test A failed: {resA.text}"
    base_sess_id = resA.json()["sessionId"]
    base_qr_token = resA.json()["qrToken"]
    print("  [PASS] Test A: Session created (201)\n")
    passed_count += 1

    print("TEST B: GPS unavailable (null latitude) -> Session rejected...")
    resB = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": None, "longitude": base_lon, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resB.status_code == 400, f"Test B failed: {resB.text}"
    print("  [PASS] Test B: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST C: GPS permission denied (null coords) -> Session rejected...")
    resC = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": None, "longitude": None, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resC.status_code == 400, f"Test C failed: {resC.text}"
    print("  [PASS] Test C: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST D: GPS timeout (no coords passed) -> Session rejected...")
    resD = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resD.status_code == 400, f"Test D failed: {resD.text}"
    print("  [PASS] Test D: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST E: Null coordinates -> Session rejected...")
    resE = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": None, "longitude": None
    }, headers=fac_headers)
    assert resE.status_code == 400, f"Test E failed: {resE.text}"
    print("  [PASS] Test E: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST F: Invalid latitude (> 90) -> Session rejected...")
    resF = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": 105.0, "longitude": base_lon, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resF.status_code == 400, f"Test F failed: {resF.text}"
    print("  [PASS] Test F: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST G: Invalid longitude (<-180) -> Session rejected...")
    resG = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": base_lat, "longitude": -195.0, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resG.status_code == 400, f"Test G failed: {resG.text}"
    print("  [PASS] Test G: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST H: NaN coordinates -> Session rejected...")
    resH = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": "NaN", "longitude": base_lon, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resH.status_code == 400, f"Test H failed: {resH.text}"
    print("  [PASS] Test H: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST I: Infinity coordinates -> Session rejected...")
    resI = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": "Infinity", "longitude": base_lon, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resI.status_code == 400, f"Test I failed: {resI.text}"
    print("  [PASS] Test I: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST J: Stale faculty GPS (> 5 mins old) -> Session rejected...")
    stale_ts = now_ms - 600000
    resJ = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": base_lat, "longitude": base_lon, "locationAccuracyMeters": 10.0, "locationTimestamp": stale_ts, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resJ.status_code == 400, f"Test J failed: {resJ.text}"
    print("  [PASS] Test J: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST K: Poor faculty GPS accuracy (> 200m) -> Session rejected...")
    resK = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": base_lat, "longitude": base_lon, "locationAccuracyMeters": 250.0, "locationTimestamp": now_ms, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resK.status_code == 400, f"Test K failed: {resK.text}"
    print("  [PASS] Test K: HTTP 400 Bad Request\n")
    passed_count += 1

    print("TEST L: Fallback Bengaluru coordinates -> MUST NOT be silently accepted...")
    # Verify that Bengaluru fallback coordinates are NOT default-filled when null
    resL = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": None, "longitude": None, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resL.status_code == 400, f"Test L failed: {resL.text}"
    print("  [PASS] Test L: Fallback coordinates rejected (HTTP 400)\n")
    passed_count += 1

    print("TEST M: Valid Chennai coordinates -> Accepted...")
    resM = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "10:00", "endTime": "11:00",
        "latitude": 13.0827, "longitude": 80.2707, "locationAccuracyMeters": 10.0, "locationTimestamp": now_ms, "allowedRadiusMeters": 100.0
    }, headers=fac_headers)
    assert resM.status_code in [200, 201], f"Test M failed: {resM.text}"
    print("  [PASS] Test M: Accepted (201)\n")
    passed_count += 1

    print("TEST N: Session coordinates persist after faculty logout...")
    requests.post(f"{GATEWAY_URL}/api/auth/logout", headers=fac_headers)
    conn = mysql.connector.connect(host='localhost', user='root', password='nathiya06')
    cursor = conn.cursor(dictionary=True)
    cursor.execute("USE attendance_db;")
    cursor.execute("SELECT latitude, longitude, allowed_radius_meters FROM attendance_sessions WHERE session_id = %s;", (base_sess_id,))
    rowN = cursor.fetchone()
    conn.close()
    assert rowN["latitude"] == base_lat and rowN["longitude"] == base_lon, f"Test N failed: {rowN}"
    print("  [PASS] Test N: Persistent session coordinates in MySQL after logout\n")
    passed_count += 1

    # --- STUDENT VERIFICATION TESTS (O - X) ---
    print("TEST O: Same coordinates -> LOCATION_VALID...")
    resO = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": base_lat, "longitude": base_lon, "accuracy": 5.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    assert resO["status"] == "LOCATION_VALID" and resO["distanceMeters"] == 0.0, f"Test O failed: {resO}"
    print("  [PASS] Test O: LOCATION_VALID, distanceMeters=0.0m\n")
    passed_count += 1

    print("TEST P: 25m inside radius -> LOCATION_VALID...")
    in_lat, in_lon = offset_point(base_lat, base_lon, 25.0, 45.0)
    resP = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": in_lat, "longitude": in_lon, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    assert resP["status"] == "LOCATION_VALID" and resP["verified"] == True, f"Test P failed: {resP}"
    print(f"  [PASS] Test P: LOCATION_VALID, distance={resP['distanceMeters']}m\n")
    passed_count += 1

    print("TEST Q: Exact boundary (98m away)...")
    b_lat, b_lon = offset_point(base_lat, base_lon, 98.0, 90.0)
    resQ = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": b_lat, "longitude": b_lon, "accuracy": 5.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    assert resQ["status"] in ["LOCATION_VALID", "LOCATION_UNCERTAIN"], f"Test Q failed: {resQ}"
    print(f"  [PASS] Test Q: Status={resQ['status']}, distance={resQ['distanceMeters']}m\n")
    passed_count += 1

    print("TEST R: 250m outside radius -> LOCATION_OUTSIDE_RADIUS...")
    out_lat, out_lon = offset_point(base_lat, base_lon, 250.0, 180.0)
    resR = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": out_lat, "longitude": out_lon, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    assert resR["status"] == "LOCATION_OUTSIDE_RADIUS" and resR["verified"] == False, f"Test R failed: {resR}"
    print(f"  [PASS] Test R: LOCATION_OUTSIDE_RADIUS, distance={resR['distanceMeters']}m\n")
    passed_count += 1

    print("TEST S: Stale student GPS (10 mins old) -> LOCATION_STALE...")
    resS = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": base_lat, "longitude": base_lon, "accuracy": 10.0, "timestamp": int(time.time()*1000) - 600000
    }, headers=stu_headers).json()
    assert resS["status"] == "LOCATION_STALE" and resS["verified"] == False, f"Test S failed: {resS}"
    print("  [PASS] Test S: LOCATION_STALE, verified=False\n")
    passed_count += 1

    print("TEST T: Poor student accuracy (250m) -> LOCATION_UNCERTAIN...")
    resT = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": base_lat, "longitude": base_lon, "accuracy": 250.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    assert resT["status"] == "LOCATION_UNCERTAIN" and resT["verified"] == False, f"Test T failed: {resT}"
    print("  [PASS] Test T: LOCATION_UNCERTAIN, verified=False\n")
    passed_count += 1

    print("TEST U: Missing session coordinates -> SESSION_LOCATION_UNAVAILABLE...")
    conn = mysql.connector.connect(host='localhost', user='root', password='nathiya06')
    cursor = conn.cursor()
    cursor.execute("USE attendance_db;")
    cursor.execute("INSERT INTO attendance_sessions (session_id, faculty_user_id, subject_id, session_date, start_time, end_time, status, plaintext_qr_token, qr_token_hash, latitude, longitude, allowed_radius_meters, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW());",
                   (f"SESS_NULL_COORDS_{uuid.uuid4().hex[:6]}", 271, "IT302", "2026-08-14", "10:00", "11:00", "LIVE", f"QR_{uuid.uuid4()}", "HASH", None, None, 100.0))
    conn.commit()
    cursor.execute("SELECT session_id FROM attendance_sessions WHERE latitude IS NULL AND status = 'LIVE' ORDER BY id DESC LIMIT 1;")
    null_sess_id = cursor.fetchone()[0]
    conn.close()

    resU = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": null_sess_id, "latitude": base_lat, "longitude": base_lon, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    assert resU["status"] == "SESSION_LOCATION_UNAVAILABLE" and resU["verified"] == False, f"Test U failed: {resU}"
    print("  [PASS] Test U: SESSION_LOCATION_UNAVAILABLE, verified=False\n")
    passed_count += 1

    print("TEST V: Swapped latitude/longitude -> Rejected...")
    resV = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": base_lon, "longitude": base_lat, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    assert resV["status"] == "LOCATION_OUTSIDE_RADIUS" and resV["verified"] == False, f"Test V failed: {resV}"
    print(f"  [PASS] Test V: LOCATION_OUTSIDE_RADIUS, distance={resV['distanceMeters']}m\n")
    passed_count += 1

    print("TEST W: Multiple sessions remain isolated...")
    # Re-login faculty
    fac_login_w = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"})
    fac_headers_w = {"Authorization": f"Bearer {fac_login_w.json()['token']}"}
    latW, lonW = 12.9716, 77.5946
    sessW = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json={
        "subjectId": "IT302", "sessionDate": "2026-08-14", "startTime": "00:00", "endTime": "23:59",
        "latitude": latW, "longitude": lonW, "locationAccuracyMeters": 10.0, "locationTimestamp": int(time.time()*1000), "allowedRadiusMeters": 100.0
    }, headers=fac_headers_w).json()["sessionId"]

    resW_match = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": sessW, "latitude": latW, "longitude": lonW, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    resW_mismatch = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": latW, "longitude": lonW, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()

    assert resW_match["status"] == "LOCATION_VALID" and resW_mismatch["status"] == "LOCATION_OUTSIDE_RADIUS", f"Test W failed: {resW_match} / {resW_mismatch}"
    print("  [PASS] Test W: Isolated sessions verified\n")
    passed_count += 1

    print("TEST X: Multiple students independently verify the same session...")
    stu2_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "giri@college.edu", "password": "admin123"})
    stu2_headers = {"Authorization": f"Bearer {stu2_login.json()['token']}"}
    resX1 = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": base_lat, "longitude": base_lon, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu_headers).json()
    resX2 = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": base_sess_id, "latitude": base_lat, "longitude": base_lon, "accuracy": 10.0, "timestamp": int(time.time()*1000)
    }, headers=stu2_headers).json()
    assert resX1["status"] == "LOCATION_VALID" and resX2["status"] == "LOCATION_VALID", f"Test X failed: {resX1} / {resX2}"
    print("  [PASS] Test X: Both students independently verified\n")
    passed_count += 1

    # --- END-TO-END VERIFICATION TESTS (Y - AB) ---
    print("TEST Y: QR + Face + Location + Device -> Fraud -> ML -> Attendance...")
    qr_res = requests.post(f"{GATEWAY_URL}/api/student/attendance/verify-qr", json={"sessionId": base_sess_id, "qrToken": base_qr_token}, headers=stu_headers).json()
    attempt_id = qr_res["verificationAttemptId"]

    loc_upd = requests.put(f"{GATEWAY_URL}/api/student/attendance/location-status", json={
        "sessionId": base_sess_id, "studentUserId": stu_user_id,
        "qrStatus": "QR_VALID", "faceStatus": "FACE_MATCH", "locationStatus": "LOCATION_VALID", "deviceStatus": "DEVICE_RECOGNIZED"
    }, headers=stu_headers).json()

    fraud_res = requests.get(f"{GATEWAY_URL}/api/fraud/assessments/attempt/{attempt_id}", headers=stu_headers).json()
    ml_res = requests.post(f"{GATEWAY_URL}/api/ml/predict", json={"attemptId": attempt_id}, headers=stu_headers).json()
    ml_label = ml_res.get("anomalyLabel", ml_res.get("anomaly_label"))

    assert loc_upd["overallStatus"] == "SAFE" and fraud_res["decision"] == "SAFE" and ml_label == "NORMAL", f"Test Y failed: {loc_upd} / {fraud_res} / {ml_res}"
    print(f"  [PASS] Test Y: Multi-signal verification passed! Fraud: {fraud_res['decision']}, ML: {ml_label}\n")
    passed_count += 1

    print("TEST Z: Student history updated...")
    stu_hist = requests.get(f"{GATEWAY_URL}/api/student/attendance/history", headers=stu_headers).json()
    assert len(stu_hist) > 0, f"Test Z failed: {stu_hist}"
    print(f"  [PASS] Test Z: Student history count = {len(stu_hist)}\n")
    passed_count += 1

    print("TEST AA: Faculty attendance updated...")
    fac_recs = requests.get(f"{GATEWAY_URL}/api/faculty/attendance/sessions/{base_sess_id}/attendance", headers=fac_headers_w).json()
    assert len(fac_recs) > 0 and fac_recs[0]["attendanceStatus"] == "PRESENT", f"Test AA failed: {fac_recs}"
    print(f"  [PASS] Test AA: Faculty session records count = {len(fac_recs)}, Status = {fac_recs[0]['attendanceStatus']}\n")
    passed_count += 1

    print("TEST AB: Admin attendance/metrics updated...")
    admin_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['token']}"}
    admin_m = requests.get(f"{GATEWAY_URL}/api/admin/metrics", headers=admin_headers).json()
    assert admin_m["totalStudents"] > 0 and admin_m["totalFaculty"] > 0, f"Test AB failed: {admin_m}"
    print(f"  [PASS] Test AB: Admin metrics verified ({admin_m['totalStudents']} Students, {admin_m['totalFaculty']} Faculty)\n")
    passed_count += 1

    print("================================================================================")
    print(f"FINAL RESULT: {passed_count} / {total_count} TESTS PASSED (100%)")
    print("================================================================================")

if __name__ == "__main__":
    run_tests()
