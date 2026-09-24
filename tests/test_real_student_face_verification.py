import requests
import json
import base64
import time
import io
import hashlib
import cv2
import numpy as np
from PIL import Image
import mysql.connector

GATEWAY_URL = "http://localhost:8081"

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3306,
        user="root",
        password="nathiya06",
        database="attendance_student_db"
    )

def generate_test_face_b64(seed=1, brightness=1.0, shift_x=0):
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    bg_gray = min(255, int(220 * brightness))
    img[:] = (bg_gray, bg_gray, bg_gray)

    if seed < 50:
        skin_bgr = (min(255, int(120 * brightness)), min(255, int(160 * brightness)), min(255, int(200 * brightness)))
        hair_bgr = (40, 40, 40)
        eye_dist = 55
    else:
        skin_bgr = (min(255, int(160 * brightness)), min(255, int(120 * brightness)), min(255, int(90 * brightness)))
        hair_bgr = (180, 140, 100)
        eye_dist = 55

    face_w, face_h = 100, 140

    # Hair
    cv2.rectangle(img, (320 + shift_x - face_w, 260 - face_h - 40), (320 + shift_x + face_w, 260 - face_h + 40), hair_bgr, -1)
    # Head
    cv2.ellipse(img, (320 + shift_x, 260), (face_w, face_h), 0, 0, 360, skin_bgr, -1)
    # Eyebrows
    cv2.line(img, (320 + shift_x - eye_dist - 20, 210), (320 + shift_x - eye_dist + 20, 210), (10, 10, 10), 6)
    cv2.line(img, (320 + shift_x + eye_dist - 20, 210), (320 + shift_x + eye_dist + 20, 210), (10, 10, 10), 6)
    # Eyes
    cv2.circle(img, (320 + shift_x - eye_dist, 230), 16, (255, 255, 255), -1)
    cv2.circle(img, (320 + shift_x - eye_dist, 230), 8, (10, 10, 10), -1)
    cv2.circle(img, (320 + shift_x + eye_dist, 230), 16, (255, 255, 255), -1)
    cv2.circle(img, (320 + shift_x + eye_dist, 230), 8, (10, 10, 10), -1)
    # Nose
    cv2.line(img, (320 + shift_x, 230), (315 + shift_x, 290), (max(0, skin_bgr[0]-30), max(0, skin_bgr[1]-30), max(0, skin_bgr[2]-30)), 5)
    # Lips
    cv2.ellipse(img, (320 + shift_x, 340), (45, 15), 0, 0, 180, (40, 40, 180), -1)

    _, buf = cv2.imencode(".jpg", img)
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
    frame_id = "FRM_" + hashlib.sha256(buf.tobytes()).hexdigest()[:12]
    return b64, frame_id

def generate_invalid_b64():
    return "NOT_AN_IMAGE_BASE64_DATA_CORRUPT"

def login_user(email, password):
    resp = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json().get("token"), resp.json().get("mustChangePassword", False)
    return None, False

def create_student_by_faculty(fac_token, email, student_id):
    resp = requests.post(f"{GATEWAY_URL}/api/faculty/students", json={
        "email": email,
        "password": "TempPass123!",
        "fullName": f"ArcFace Student {student_id}",
        "studentId": student_id,
        "department": "Computer Science",
        "course": "B.Tech",
        "year": "3",
        "section": "A",
        "phone": "9876543210"
    }, headers={"Authorization": f"Bearer {fac_token}", "Content-Type": "application/json"})
    return resp.status_code == 201

def setup_active_student_token(fac_token, email, student_id):
    create_student_by_faculty(fac_token, email, student_id)
    token_temp, must_change = login_user(email, "TempPass123!")
    if must_change:
        resp_pwd = requests.put(f"{GATEWAY_URL}/api/auth/password", json={
            "currentPassword": "TempPass123!",
            "newPassword": "NewActivePass123!"
        }, headers={"Authorization": f"Bearer {token_temp}", "Content-Type": "application/json"})
        assert resp_pwd.status_code == 200, f"Password change failed for {email}: {resp_pwd.text}"
        token_active, _ = login_user(email, "NewActivePass123!")
        return token_active
    return token_temp

def run_all_tests():
    print("=" * 60)
    print("STARTING REAL STUDENT FACE VERIFICATION TEST SUITE (A - L)")
    print("=" * 60)

    # 1. Faculty Authentication
    fac_token, _ = login_user("vishal@college.edu", "admin123")
    assert fac_token is not None, "Faculty login failed!"
    print("Faculty authenticated successfully.")

    # 2. Setup 2 Test Students
    ts = int(time.time())
    email_a = f"arcface_stu_a_{ts}@college.edu"
    email_b = f"arcface_stu_b_{ts}@college.edu"

    token_a = setup_active_student_token(fac_token, email_a, f"STU_ARC_A_{ts}")
    token_b = setup_active_student_token(fac_token, email_b, f"STU_ARC_B_{ts}")

    assert token_a is not None, f"Failed to setup Student A ({email_a})"
    assert token_b is not None, f"Failed to setup Student B ({email_b})"
    print("Test Setup: Student A and Student B successfully created and authenticated.")

    headers_a = {"Authorization": f"Bearer {token_a}", "Content-Type": "application/json"}
    headers_b = {"Authorization": f"Bearer {token_b}", "Content-Type": "application/json"}

    # Generate distinct frames
    face_a_enroll_b64, frame_a_enroll_id = generate_test_face_b64(seed=10, brightness=1.0, shift_x=0)
    face_a_attend_b64, frame_a_attend_id = generate_test_face_b64(seed=10, brightness=1.08, shift_x=2)
    face_b_enroll_b64, frame_b_enroll_id = generate_test_face_b64(seed=99, brightness=1.0, shift_x=0)
    face_b_attend_b64, frame_b_attend_id = generate_test_face_b64(seed=99, brightness=0.95, shift_x=-1)

    print(f"\n[FRAME DIVERSITY PROOF]")
    print(f"Student A Enrollment Frame ID: {frame_a_enroll_id}")
    print(f"Student A Attendance Frame ID: {frame_a_attend_id}")
    print(f"Student B Enrollment Frame ID: {frame_b_enroll_id}")
    print(f"Student B Attendance Frame ID: {frame_b_attend_id}")
    assert frame_a_enroll_id != frame_a_attend_id, "CRITICAL ERROR: Enrollment and Attendance frame IDs must be different!"

    # --- TEST G: Student without enrollment ---
    print("\n--- TEST G: Unenrolled Student Face Verification ---")
    g_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": face_a_enroll_b64}, headers=headers_a)
    g_json = g_res.json()
    print("Test G Response:", g_json)
    assert g_json.get("status") == "FACE_ENROLLMENT_REQUIRED", f"Expected FACE_ENROLLMENT_REQUIRED, got {g_json.get('status')}"
    assert g_json.get("verified") == False, "Expected verified=false for unenrolled student"
    print("TEST G: PASSED")

    # --- TEST A: First-time enrollment succeeds ---
    print("\n--- TEST A: First-Time Student Face Enrollment ---")
    a_res = requests.post(f"{GATEWAY_URL}/api/student/face/enroll", json={"frameBase64": face_a_enroll_b64}, headers=headers_a)
    a_json = a_res.json()
    print("Test A Response:", a_json)
    assert a_res.status_code == 200, f"Expected 200 OK, got {a_res.status_code}"
    assert a_json.get("status") == "COMPLETED", f"Expected status=COMPLETED, got {a_json.get('status')}"
    print("TEST A: PASSED")

    # --- TEST B: Enrollment creates exactly one DB record ---
    print("\n--- TEST B: Database Record Count & Ownership ---")
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT s.id FROM students s WHERE s.email = %s", (email_a,))
    stu_row = cursor.fetchone()
    stu_a_id = stu_row["id"]

    cursor.execute("SELECT * FROM face_enrollments WHERE student_id = %s", (stu_a_id,))
    enroll_rows = cursor.fetchall()
    print(f"DB face_enrollments count for student_id={stu_a_id}: {len(enroll_rows)}")
    assert len(enroll_rows) == 1, f"Expected exactly 1 enrollment record, found {len(enroll_rows)}"
    assert enroll_rows[0]["status"] == "COMPLETED"
    assert enroll_rows[0]["template_reference"] is not None
    assert len(enroll_rows[0]["template_reference"]) > 100, "Expected full 512D ArcFace JSON string in DB"
    db.close()
    print("TEST B: PASSED")

    # --- TEST C: Stored enrollment survives logout/login ---
    print("\n--- TEST C: Enrollment Persistence Across Logout/Login ---")
    token_a_new, _ = login_user(email_a, "NewActivePass123!")
    headers_a_new = {"Authorization": f"Bearer {token_a_new}", "Content-Type": "application/json"}
    c_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": face_a_attend_b64}, headers=headers_a_new)
    c_json = c_res.json()
    print("Test C Response:", c_json)
    assert c_json.get("verified") == True, f"Expected verified=true after re-login, got {c_json}"
    assert c_json.get("status") == "FACE_MATCH"
    assert c_json.get("frameId") == frame_a_attend_id, "Frame ID must match live attendance frame"
    print("TEST C: PASSED")

    # --- TEST D: Stored enrollment survives service restart (DB check) ---
    print("\n--- TEST D: DB Persistence Verification ---")
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT status, template_reference FROM face_enrollments WHERE student_id = %s", (stu_a_id,))
    d_row = cursor.fetchone()
    assert d_row is not None and d_row["status"] == "COMPLETED"
    db.close()
    print("TEST D: PASSED")

    # --- TEST E: Student A Authenticated + Student A NEW Attendance Frame ---
    print("\n--- TEST E: Student A Authenticated + Student A NEW Attendance Frame ---")
    e_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": face_a_attend_b64}, headers=headers_a)
    e_json = e_res.json()
    print("Test E Response:", e_json)
    assert e_json.get("verified") == True, f"Student A new attendance frame should be verified: {e_json}"
    assert e_json.get("status") == "FACE_MATCH"
    assert e_json.get("frameId") == frame_a_attend_id
    assert e_json.get("frameId") != frame_a_enroll_id, "Attendance frame ID must be DIFFERENT from enrollment frame ID!"
    assert e_json.get("similarity") < 1.0000, "Similarity for a NEW camera frame must be < 1.0000 (proving new frame capture)"
    assert e_json.get("similarity") >= 0.75, "Similarity for Student A new frame must satisfy threshold >= 0.75"
    print(f"TEST E: PASSED (Frame ID: {e_json.get('frameId')}, Similarity: {e_json.get('similarity')})")

    # --- TEST F & M: Student A authenticated + Student B face ---
    print("\n--- TEST F & M: Student A Authenticated + Student B Face (Cross-Person Check) ---")
    requests.post(f"{GATEWAY_URL}/api/student/face/enroll", json={"frameBase64": face_b_enroll_b64}, headers=headers_b)

    # Student A authenticated, submits Student B's new attendance frame
    f_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": face_b_attend_b64}, headers=headers_a)
    f_json = f_res.json()
    print("Test F & M Response:", f_json)
    assert f_json.get("verified") == False, f"CRITICAL SECURITY FAILURE: Student B face was accepted for Student A! {f_json}"
    assert f_json.get("status") == "FACE_MISMATCH"
    assert f_json.get("frameId") == frame_b_attend_id
    print(f"TEST F & M: PASSED (Frame ID: {f_json.get('frameId')}, Similarity: {f_json.get('similarity')} < Threshold)")

    # --- TEST H: No face in frame ---
    print("\n--- TEST H: No Face Frame Verification ---")
    blank_img = Image.new('RGB', (200, 200), color=(10, 10, 10))
    buf_h = io.BytesIO()
    blank_img.save(buf_h, format='JPEG')
    h_b64 = base64.b64encode(buf_h.getvalue()).decode('utf-8')

    h_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": h_b64}, headers=headers_a)
    h_json = h_res.json()
    print("Test H Response:", h_json)
    assert h_json.get("verified") == False
    assert h_json.get("status") in ["FACE_NOT_DETECTED", "FACE_INVALID", "FACE_MISMATCH"]
    print("TEST H: PASSED")

    # --- TEST I: Multiple faces ---
    print("\n--- TEST I: Multiple Faces Frame Verification ---")
    multi_img = np.zeros((400, 600, 3), dtype=np.uint8)
    multi_img[:] = (230, 230, 230)
    cv2.rectangle(multi_img, (50, 40), (230, 140), (20, 20, 20), -1)
    cv2.ellipse(multi_img, (140, 200), (70, 90), 0, 0, 360, (210, 180, 140), -1)
    cv2.circle(multi_img, (110, 180), 10, (10, 10, 10), -1)
    cv2.circle(multi_img, (170, 180), 10, (10, 10, 10), -1)
    cv2.line(multi_img, (140, 200), (135, 230), (170, 140, 100), 4)
    cv2.ellipse(multi_img, (140, 255), (30, 10), 0, 0, 180, (50, 50, 180), -1)
    cv2.rectangle(multi_img, (370, 40), (550, 140), (100, 50, 20), -1)
    cv2.ellipse(multi_img, (460, 200), (70, 90), 0, 0, 360, (90, 70, 50), -1)
    cv2.circle(multi_img, (430, 180), 10, (10, 10, 10), -1)
    cv2.circle(multi_img, (490, 180), 10, (10, 10, 10), -1)
    cv2.line(multi_img, (460, 200), (455, 230), (60, 40, 20), 4)
    cv2.ellipse(multi_img, (460, 255), (30, 10), 0, 0, 180, (50, 50, 180), -1)
    _, buf_m = cv2.imencode(".jpg", multi_img)
    multi_b64 = base64.b64encode(buf_m.tobytes()).decode("utf-8")

    multi_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": multi_b64}, headers=headers_a)
    multi_json = multi_res.json()
    print("Test I Response:", multi_json)
    assert multi_json.get("verified") == False
    assert multi_json.get("status") in ["MULTIPLE_FACES_DETECTED", "MULTIPLE_FACES", "FACE_INVALID", "FACE_MISMATCH", "FACE_NOT_DETECTED"]
    print("TEST I: PASSED")

    # --- TEST J: Invalid/corrupt image ---
    print("\n--- TEST J: Invalid Image Frame Verification ---")
    j_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": generate_invalid_b64()}, headers=headers_a)
    j_json = j_res.json()
    print("Test J Response:", j_json)
    assert j_json.get("verified") == False
    assert j_json.get("status") in ["FACE_INVALID", "INVALID_FACE_FRAME", "FACE_NOT_DETECTED"]
    print("TEST J: PASSED")

    # --- TEST K: Repeated verification does not create duplicate DB rows ---
    print("\n--- TEST K: Database Single Row Guarantee ---")
    for _ in range(3):
        requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": face_a_attend_b64}, headers=headers_a)
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM face_enrollments WHERE student_id = %s", (stu_a_id,))
    count = cursor.fetchone()[0]
    db.close()
    assert count == 1, f"Expected exactly 1 enrollment row after repeated verifications, found {count}"
    print("TEST K: PASSED")

    # --- TEST L: Third Frame Variation Verification ---
    print("\n--- TEST L: Same Student under Third Frame Variation ---")
    face_a_var3_b64, frame_a_var3_id = generate_test_face_b64(seed=10, brightness=0.92, shift_x=-2)
    assert frame_a_var3_id != frame_a_enroll_id
    assert frame_a_var3_id != frame_a_attend_id
    l_res = requests.post(f"{GATEWAY_URL}/api/student/face/verify", json={"frameBase64": face_a_var3_b64}, headers=headers_a)
    l_json = l_res.json()
    print("Test L Response:", l_json)
    assert l_json.get("verified") == True
    assert l_json.get("status") == "FACE_MATCH"
    assert l_json.get("frameId") == frame_a_var3_id
    print(f"TEST L: PASSED (Frame ID: {l_json.get('frameId')}, Similarity: {l_json.get('similarity')})")

    # Teardown test accounts cleanly
    print("\n--- Teardown Test Data ---")
    db_td = mysql.connector.connect(host="localhost", port=3306, user="root", password="nathiya06")
    cur_td = db_td.cursor()
    cur_td.execute("DELETE FROM attendance_student_db.face_enrollments WHERE student_id = %s", (stu_a_id,))
    cur_td.execute("DELETE FROM attendance_student_db.students WHERE email IN (%s, %s)", (email_a, email_b))
    cur_td.execute("DELETE FROM attendance_auth_db.users WHERE email IN (%s, %s)", (email_a, email_b))
    db_td.commit()
    db_td.close()
    print("Teardown complete.")

    print("\n" + "=" * 60)
    print("ALL REAL STUDENT FACE VERIFICATION TESTS (A - L) PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
