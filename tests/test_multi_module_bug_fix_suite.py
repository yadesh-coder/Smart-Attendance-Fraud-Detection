import requests, time, mysql.connector

GATEWAY_URL = "http://localhost:8081"

def run_bug_fix_suite():
    print("=" * 80)
    print("RUNNING MULTI-MODULE BUG FIX & SYNCHRONIZATION SUITE (GROUPS 1 - 5)")
    print("=" * 80)

    passed_count = 0
    total_tests = 5

    # Auth headers setup
    fac_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "vishal@college.edu", "password": "admin123"}).json()
    fac_headers = {"Authorization": f"Bearer {fac_login['token']}", "Content-Type": "application/json"}

    admin_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"}).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['token']}", "Content-Type": "application/json"}

    stu_login = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": "362@college.edu", "password": "admin123"}).json()
    stu_headers = {"Authorization": f"Bearer {stu_login['token']}", "Content-Type": "application/json"}

    # -------------------------------------------------------------------------
    # GROUP 1: Faculty -> Student Edit Persistence
    # -------------------------------------------------------------------------
    print("\nGROUP 1: Faculty -> Student Edit Persistence...")
    fac_students = requests.get(f"{GATEWAY_URL}/api/faculty/students", headers=fac_headers).json()
    target_stu = next((s for s in fac_students if s.get("studentId") == "362" or s.get("email") == "362@college.edu"), fac_students[0])
    stu_db_id = target_stu["id"]

    edit_payload = {
        "fullName": "ss_VerifiedEdit",
        "name": "ss_VerifiedEdit",
        "department": "EEE",
        "semester": 4,
        "section": "C",
        "status": "ACTIVE"
    }

    put_res = requests.put(f"{GATEWAY_URL}/api/faculty/students/{stu_db_id}", json=edit_payload, headers=fac_headers)
    assert put_res.status_code == 200, f"Group 1 PUT failed: {put_res.text}"
    updated_stu = put_res.json()
    assert updated_stu.get("fullName") == "ss_VerifiedEdit" or updated_stu.get("name") == "ss_VerifiedEdit", f"Group 1 DTO update failed: {updated_stu}"
    assert updated_stu.get("department") == "EEE", f"Group 1 dept update failed: {updated_stu}"

    # Verify via direct GET API call
    recheck_stu = requests.get(f"{GATEWAY_URL}/api/faculty/students/{stu_db_id}", headers=fac_headers).json()
    assert recheck_stu.get("fullName") == "ss_VerifiedEdit" or recheck_stu.get("name") == "ss_VerifiedEdit", f"Group 1 recheck failed: {recheck_stu}"

    # Verify MySQL DB directly
    db_conn = mysql.connector.connect(host='localhost', user='root', password='nathiya06', database='attendance_student_db')
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute("SELECT full_name, department FROM students WHERE id = %s", (stu_db_id,))
    db_row = cursor.fetchone()
    db_conn.close()
    assert db_row["full_name"] == "ss_VerifiedEdit" and db_row["department"] == "EEE", f"Group 1 DB row failed: {db_row}"

    print("  [PASS] Group 1: Faculty student edit successfully persisted to MySQL database & verified via API\n")
    passed_count += 1

    # -------------------------------------------------------------------------
    # GROUP 2: Admin -> Department Removal & Conflict Handling
    # -------------------------------------------------------------------------
    print("GROUP 2: Admin -> Department Removal & Conflict Handling...")
    depts_res = requests.get(f"{GATEWAY_URL}/api/admin/departments", headers=admin_headers)
    assert depts_res.status_code == 200, f"Group 2 GET departments failed: {depts_res.text}"
    depts = depts_res.json()

    # 2a. Attempt deleting a referenced department -> MUST return 409 Conflict
    ref_dept = next((d for d in depts if "Computer Science" in d["name"] or d["code"] == "CSE"), depts[0])
    conflict_del_res = requests.delete(f"{GATEWAY_URL}/api/admin/departments/{ref_dept['id']}", headers=admin_headers)
    assert conflict_del_res.status_code == 409, f"Group 2 conflict check failed: {conflict_del_res.status_code} - {conflict_del_res.text}"
    assert "cannot be removed" in conflict_del_res.json()["message"], f"Group 2 conflict message failed: {conflict_del_res.text}"

    # 2b. Add an unreferenced test department and delete it -> MUST succeed with 200 OK
    tmp_code = f"TMP{int(time.time()) % 1000}"
    add_dept_res = requests.post(f"{GATEWAY_URL}/api/admin/departments", json={"name": f"Temp Dept {tmp_code}", "code": tmp_code}, headers=admin_headers)
    assert add_dept_res.status_code == 201, f"Group 2 add temp dept failed: {add_dept_res.text}"
    created_dept_id = add_dept_res.json()["id"]

    del_res = requests.delete(f"{GATEWAY_URL}/api/admin/departments/{created_dept_id}", headers=admin_headers)
    assert del_res.status_code == 200, f"Group 2 delete temp dept failed: {del_res.text}"

    print("  [PASS] Group 2: Department management verified (Referenced deletion blocked with 409 Conflict; unreferenced deletion succeeded)\n")
    passed_count += 1

    # -------------------------------------------------------------------------
    # GROUP 3: Admin -> Faculty Profile Synchronization
    # -------------------------------------------------------------------------
    print("GROUP 3: Admin -> Faculty Profile Synchronization...")
    fac_list = requests.get(f"{GATEWAY_URL}/api/admin/faculty", headers=admin_headers).json()
    target_fac = next((f for f in fac_list if f.get("email") == "vishal@college.edu"), fac_list[0])
    fac_db_id = target_fac["id"]

    admin_fac_update = {
        "fullName": "Dr. Vishal Kumar Updated",
        "department": "Computer Science & Engineering",
        "designation": "Professor & HOD",
        "phone": "9998887776",
        "status": "ACTIVE"
    }

    update_res = requests.put(f"{GATEWAY_URL}/api/admin/faculty/{fac_db_id}", json=admin_fac_update, headers=admin_headers)
    assert update_res.status_code == 200, f"Group 3 Admin PUT failed: {update_res.text}"

    # Verify Faculty Profile API returns updated profile when Faculty queries GET /api/faculty/profile
    fac_profile_res = requests.get(f"{GATEWAY_URL}/api/faculty/profile", headers=fac_headers)
    assert fac_profile_res.status_code == 200, f"Group 3 Faculty profile GET failed: {fac_profile_res.text}"
    fac_prof = fac_profile_res.json()
    assert fac_prof["fullName"] == "Dr. Vishal Kumar Updated", f"Group 3 Faculty sync failed name: {fac_prof}"
    assert fac_prof["designation"] == "Professor & HOD", f"Group 3 Faculty sync failed designation: {fac_prof}"

    print("  [PASS] Group 3: Admin faculty profile update immediately synchronized with Faculty profile API\n")
    passed_count += 1

    # -------------------------------------------------------------------------
    # GROUP 4: Universal Profile Management
    # -------------------------------------------------------------------------
    print("GROUP 4: Universal Profile Management...")
    admin_prof = requests.get(f"{GATEWAY_URL}/api/admin/profile", headers=admin_headers).json()
    assert admin_prof["role"] == "ADMIN", f"Group 4 Admin profile failed: {admin_prof}"

    fac_prof2 = requests.get(f"{GATEWAY_URL}/api/faculty/profile", headers=fac_headers).json()
    assert fac_prof2["email"] == "vishal@college.edu", f"Group 4 Faculty profile failed: {fac_prof2}"

    stu_prof = requests.get(f"{GATEWAY_URL}/api/student/profile", headers=stu_headers).json()
    assert stu_prof["email"] == "362@college.edu", f"Group 4 Student profile failed: {stu_prof}"

    print("  [PASS] Group 4: Universal profile endpoints verified across Admin, Faculty, and Student roles\n")
    passed_count += 1

    # -------------------------------------------------------------------------
    # GROUP 5: Student Attendance Pipeline & Verification Status
    # -------------------------------------------------------------------------
    print("GROUP 5: Student Attendance Pipeline & Verification Status...")
    # 5a. Faculty creates an active attendance session
    now = time.localtime()
    start_time = f"{(now.tm_hour + 1) % 24:02d}:{now.tm_min:02d}"
    end_time = f"{(now.tm_hour + 2) % 24:02d}:{now.tm_min:02d}"
    session_date = time.strftime("%Y-%m-%d", now)

    # Get or create a faculty subject code
    fac_subs = requests.get(f"{GATEWAY_URL}/api/faculty/subjects", headers=fac_headers).json()
    if not fac_subs:
        sub_res = requests.post(f"{GATEWAY_URL}/api/faculty/subjects", json={
            "subjectCode": f"S{int(time.time()) % 10000}",
            "subjectName": "Java Programming",
            "department": "Computer Science & Engineering"
        }, headers=fac_headers).json()
        sub_code = sub_res["subjectCode"]
    else:
        sub_code = fac_subs[0]["subjectCode"]

    sess_payload = {
        "subjectId": sub_code,
        "sessionDate": session_date,
        "startTime": start_time,
        "endTime": end_time,
        "latitude": 13.0827,
        "longitude": 80.2707,
        "allowedRadiusMeters": 100.0,
        "locationAccuracyMeters": 10.0,
        "locationTimestamp": int(time.time() * 1000)
    }

    sess_res = requests.post(f"{GATEWAY_URL}/api/faculty/attendance/sessions", json=sess_payload, headers=fac_headers)
    assert sess_res.status_code in [200, 201], f"Group 5 session creation failed: {sess_res.text}"
    sess = sess_res.json()
    session_id = sess["sessionId"]
    qr_token = sess["qrToken"]

    # 5b. Student verifies QR
    qr_res = requests.post(f"{GATEWAY_URL}/api/student/attendance/verify-qr", json={"sessionId": session_id, "qrToken": qr_token}, headers=stu_headers).json()
    attempt_id = qr_res.get("attemptId") or qr_res.get("verificationAttemptId")

    # 5c. Student verifies location
    loc_res = requests.post(f"{GATEWAY_URL}/api/student/location/verify", json={
        "sessionId": session_id,
        "latitude": 13.0827,
        "longitude": 80.2707,
        "accuracyMeters": 10.0,
        "locationTimestamp": int(time.time() * 1000)
    }, headers=stu_headers).json()
    assert loc_res["verified"] is True or loc_res["locationStatus"] == "LOCATION_VALID", f"Group 5 location failed: {loc_res}"

    # 5d. Student verifies face
    face_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"sessionId": session_id, "imageData": "DATA_URI"}, headers=stu_headers).json()

    # 5e. Student verifies device
    dev_res = requests.post(f"{GATEWAY_URL}/api/student/device/verify", json={"sessionId": session_id, "deviceLabel": "Win32 Browser", "deviceFingerprintHash": "HASH_123"}, headers=stu_headers).json()

    # 5f. Update attendance service attempt signals with verified signals
    signal_res = requests.put(f"{GATEWAY_URL}/api/student/attendance/location-status", json={
        "sessionId": session_id,
        "faceStatus": "FACE_MATCH",
        "locationStatus": "LOCATION_VALID",
        "deviceStatus": "DEVICE_RECOGNIZED"
    }, headers=stu_headers)
    assert signal_res.status_code == 200, f"Group 5 signal update failed: {signal_res.text}"

    # 5g. Student queries attendance history -> MUST return PRESENT, VERIFIED, SAFE with subjectName
    history_res = requests.get(f"{GATEWAY_URL}/api/student/attendance/history", headers=stu_headers)
    assert history_res.status_code == 200, f"Group 5 history GET failed: {history_res.text}"
    history = history_res.json()

    latest_record = next((h for h in history if h.get("sessionId") == session_id or h.get("verificationAttemptId") == attempt_id), history[-1])
    assert latest_record["attendanceStatus"] == "PRESENT", f"Group 5 attendanceStatus failed: {latest_record}"
    assert latest_record["verificationStatus"] in ["VERIFIED", "SAFE"], f"Group 5 verificationStatus failed: {latest_record}"
    assert latest_record["fraudStatus"] == "SAFE" or latest_record["decision"] == "SAFE", f"Group 5 fraudStatus failed: {latest_record}"
    assert latest_record["subjectName"] is not None and latest_record["subjectName"] != "", f"Group 5 subjectName failed: {latest_record}"

    print(f"  [PASS] Group 5: Full attendance verification pipeline completed cleanly (Status: PRESENT, Verification: VERIFIED, Fraud: SAFE, Subject: {latest_record.get('subjectName')})\n")
    passed_count += 1

    print("=" * 80)
    print(f"FINAL RESULT: {passed_count} / {total_tests} BUG GROUPS PASSED (100%)")
    print("=" * 80)

if __name__ == "__main__":
    run_bug_fix_suite()
