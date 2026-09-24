package com.smartattendance.attendance.service;



import com.smartattendance.attendance.dto.*;

import com.smartattendance.attendance.entity.*;

import com.smartattendance.attendance.exception.AttendanceException;

import com.smartattendance.attendance.repository.*;

import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.nio.charset.StandardCharsets;

import java.security.MessageDigest;

import java.security.NoSuchAlgorithmException;

import java.security.SecureRandom;

import java.time.LocalDateTime;

import java.time.ZoneId;

import java.time.ZonedDateTime;

import java.util.*;

import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;



@Service

public class AttendanceService {



    private final AttendanceSessionRepository sessionRepository;

    private final AttendanceVerificationAttemptRepository verificationAttemptRepository;

    private final AttendanceRecordRepository recordRepository;

    private final FacultyServiceClient facultyServiceClient;

    private final StudentServiceClient studentServiceClient;

    private final FraudServiceClient fraudServiceClient;

    private final SecureRandom secureRandom = new SecureRandom();



    public AttendanceService(AttendanceSessionRepository sessionRepository,

                              AttendanceVerificationAttemptRepository verificationAttemptRepository,

                              AttendanceRecordRepository recordRepository,

                              FacultyServiceClient facultyServiceClient,

                              StudentServiceClient studentServiceClient,

                              FraudServiceClient fraudServiceClient) {

        this.sessionRepository = sessionRepository;

        this.verificationAttemptRepository = verificationAttemptRepository;

        this.recordRepository = recordRepository;

        this.facultyServiceClient = facultyServiceClient;

        this.studentServiceClient = studentServiceClient;

        this.fraudServiceClient = fraudServiceClient;

    }



    @Transactional

    public AttendanceSessionResponse createSession(CreateSessionRequest request, Long facultyUserId, String bearerToken) {

        if (request.getSubjectId() == null || request.getSubjectId().isBlank()) {

            throw new AttendanceException("Subject ID is required.", HttpStatus.BAD_REQUEST);

        }

        // ONE Authoritative Server Timestamp & End Calculation

        ZonedDateTime nowServer = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));

        int duration = (request.getDurationMinutes() != null && request.getDurationMinutes() > 0) ? request.getDurationMinutes() : 60;

        ZonedDateTime endServer = nowServer.plusMinutes(duration);



        String sessionDate = request.getSessionDate();

        if (sessionDate == null || sessionDate.isBlank()) {

            sessionDate = nowServer.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        }



        String startTime = request.getStartTime();

        if (startTime == null || startTime.isBlank()) {

            startTime = nowServer.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));

        }



        String endTime = request.getEndTime();

        if (endTime == null || endTime.isBlank() || request.getDurationMinutes() != null) {

            endTime = endServer.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));

        }



        if (request.getLatitude() != null && (request.getLatitude() < -90.0 || request.getLatitude() > 90.0)) {

            throw new AttendanceException("Latitude must be between -90 and 90 degrees.", HttpStatus.BAD_REQUEST);

        }

        if (request.getLongitude() != null && (request.getLongitude() < -180.0 || request.getLongitude() > 180.0)) {

            throw new AttendanceException("Longitude must be between -180 and 180 degrees.", HttpStatus.BAD_REQUEST);

        }

        if (request.getAllowedRadiusMeters() != null && (request.getAllowedRadiusMeters() <= 0 || request.getAllowedRadiusMeters() > 50000.0)) {

            throw new AttendanceException("Allowed radius must be positive and reasonable (max 50km).", HttpStatus.BAD_REQUEST);

        }



        // Validate faculty profile active

        Map<String, Object> facultyProfile = facultyServiceClient.getFacultyProfile(bearerToken);

        if (facultyProfile == null || !"ACTIVE".equalsIgnoreCase(String.valueOf(facultyProfile.get("status")))) {

            throw new AttendanceException("Inactive faculty members cannot create attendance sessions.", HttpStatus.FORBIDDEN);

        }



        // Validate Subject with Faculty Service

        Map<String, Object> subjectDetails = facultyServiceClient.getSubjectDetails(request.getSubjectId(), bearerToken);

        if (subjectDetails == null) {

            throw new AttendanceException("Subject record not found.", HttpStatus.NOT_FOUND);

        }



        String subjectStatus = String.valueOf(subjectDetails.get("status"));

        if (!"ACTIVE".equalsIgnoreCase(subjectStatus)) {

            throw new AttendanceException("Subject is INACTIVE. Cannot create session for inactive subject.", HttpStatus.BAD_REQUEST);

        }



        Object ownerUserIdObj = subjectDetails.get("facultyUserId");

        Long ownerUserId = ownerUserIdObj instanceof Number ? ((Number) ownerUserIdObj).longValue() : Long.parseLong(String.valueOf(ownerUserIdObj));

        if (!ownerUserId.equals(facultyUserId)) {

            throw new AttendanceException("Access denied: You do not own this subject.", HttpStatus.FORBIDDEN);

        }



        String subjectName = String.valueOf(subjectDetails.get("subjectName"));

        String subjectCode = subjectDetails.get("subjectCode") != null ? String.valueOf(subjectDetails.get("subjectCode")) : request.getSubjectId();



        // Prevent Duplicate Active/Scheduled Sessions for the same Faculty, Subject, Date, and Time Slot

        List<String> activeStatuses = Arrays.asList("LIVE", "ACTIVE", "CREATED", "SCHEDULED");

        List<AttendanceSessionEntity> existingSessions = sessionRepository.findByFacultyUserIdAndSubjectIdAndSessionDateAndStartTimeAndEndTimeAndStatusIn(

                facultyUserId, request.getSubjectId(), sessionDate, startTime, endTime, activeStatuses);

        if (!existingSessions.isEmpty()) {

            throw new AttendanceException("A session with the same faculty, subject, date, and time slot already exists.", HttpStatus.BAD_REQUEST);

        }



        String sessionId = "SESS_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        String plaintextQrToken = "QR_" + UUID.randomUUID().toString();

        // 1. Strict Server-Side Validation for Faculty Session GPS

        Double lat = request.getLatitude();

        Double lon = request.getLongitude();

        Double radius = request.getAllowedRadiusMeters() != null ? request.getAllowedRadiusMeters() : 100.0;



        if (lat == null || Double.isNaN(lat) || Double.isInfinite(lat) || lat < -90.0 || lat > 90.0 ||

            lon == null || Double.isNaN(lon) || Double.isInfinite(lon) || lon < -180.0 || lon > 180.0) {

            throw new AttendanceException("Valid faculty GPS coordinates (latitude and longitude) are required to create an attendance session.", HttpStatus.BAD_REQUEST);

        }



        if (radius <= 0.0 || Double.isNaN(radius) || Double.isInfinite(radius)) {

            throw new AttendanceException("Allowed radius must be greater than 0 meters.", HttpStatus.BAD_REQUEST);

        }



        if (request.getLocationAccuracyMeters() != null) {

            Double acc = request.getLocationAccuracyMeters();

            if (Double.isNaN(acc) || Double.isInfinite(acc) || acc < 0.0 || acc > 200.0) {

                throw new AttendanceException("Faculty GPS accuracy is too low (must be <= 200m) to establish session reference location.", HttpStatus.BAD_REQUEST);

            }

        }



        if (request.getLocationTimestamp() != null) {

            long currentMs = System.currentTimeMillis();

            long ageMs = currentMs - request.getLocationTimestamp();

            if (request.getLocationTimestamp() < 0 || ageMs > 300000 || ageMs < -60000) {

                throw new AttendanceException("Faculty GPS reading is stale (> 5 minutes old). Please refresh your location.", HttpStatus.BAD_REQUEST);

            }

        }



        String qrTokenHash = hashQrToken(plaintextQrToken);

        String attendanceCode = String.format("%06d", secureRandom.nextInt(1000000));



        AttendanceSessionEntity session = new AttendanceSessionEntity(

                sessionId,

                facultyUserId,

                request.getSubjectId(),

                subjectName,

                sessionDate,

                startTime,

                endTime,

                qrTokenHash

        );



        session.setSubjectCode(subjectCode);



        session.setPlaintextQrToken(plaintextQrToken);

        session.setAttendanceCode(attendanceCode);

        session.setStatus("LIVE");

        session.setQrIssuedAt(nowServer.toLocalDateTime());

        session.setQrExpiresAt(endServer.toLocalDateTime());



        session.setLatitude(lat);

        session.setLongitude(lon);

        session.setAllowedRadiusMeters(radius);

        session.setLocationAccuracyMeters(request.getLocationAccuracyMeters() != null ? request.getLocationAccuracyMeters() : 10.0);

        session.setLocationTimestamp(request.getLocationTimestamp() != null ? request.getLocationTimestamp() : System.currentTimeMillis());

        session.setLocationSource("BROWSER_GPS");



        AttendanceSessionEntity saved = sessionRepository.save(session);

        return mapToResponse(saved, plaintextQrToken, subjectCode, true);

    }



    @Transactional(readOnly = true)

    public List<AttendanceSessionResponse> getFacultySessions(Long facultyUserId) {

        return sessionRepository.findByFacultyUserId(facultyUserId).stream()

                .map(s -> mapToResponse(s, s.getPlaintextQrToken(), null, true))

                .collect(Collectors.toList());

    }



    private AttendanceSessionEntity findSessionByIdOrSessionId(String idOrSessionId) {

        if (idOrSessionId == null || idOrSessionId.isBlank()) {

            throw new AttendanceException("Session ID is required.", HttpStatus.BAD_REQUEST);

        }

        String clean = idOrSessionId.trim();

        try {

            Long numericId = Long.parseLong(clean);

            var opt = sessionRepository.findById(numericId);

            if (opt.isPresent()) return opt.get();

        } catch (NumberFormatException ignored) {}



        var optSession = sessionRepository.findBySessionId(clean);

        if (optSession.isPresent()) return optSession.get();



        var optCode = sessionRepository.findByAttendanceCode(clean);

        if (optCode.isPresent()) return optCode.get();



        throw new AttendanceException("Attendance session not found for: " + idOrSessionId, HttpStatus.NOT_FOUND);

    }



    @Transactional(readOnly = true)

    public AttendanceSessionResponse getFacultySessionById(Long id, Long facultyUserId) {

        return getFacultySessionById(String.valueOf(id), facultyUserId);

    }



    @Transactional(readOnly = true)

    public AttendanceSessionResponse getFacultySessionById(String idOrSessionId, Long facultyUserId) {

        AttendanceSessionEntity session = findSessionByIdOrSessionId(idOrSessionId);



        if (!session.getFacultyUserId().equals(facultyUserId)) {

            throw new AttendanceException("Access denied: You do not own this attendance session.", HttpStatus.FORBIDDEN);

        }



        return mapToResponse(session, session.getPlaintextQrToken(), null, true);

    }



    @Transactional(readOnly = true)

    public List<AttendanceRecordResponse> getSessionAttendanceRecordsForFaculty(String idOrSessionId, Long facultyUserId) {

        return getSessionParticipants(idOrSessionId, facultyUserId, null);

    }



    @Transactional(readOnly = true)

    public List<AttendanceRecordResponse> getSessionParticipants(String idOrSessionId, Long facultyUserId, String bearerToken) {

        AttendanceSessionEntity session = findSessionByIdOrSessionId(idOrSessionId);



        if (!session.getFacultyUserId().equals(facultyUserId)) {

            throw new AttendanceException("Access denied: You do not own this attendance session.", HttpStatus.FORBIDDEN);

        }



        List<AttendanceRecordEntity> records = recordRepository.findBySessionId(session.getSessionId());

        return records.stream().map(r -> mapToRecordResponseWithStudent(r, bearerToken)).collect(Collectors.toList());

    }



    private AttendanceRecordResponse mapToRecordResponse(AttendanceRecordEntity r) {

        return mapToRecordResponseWithStudent(r, null);

    }



    private AttendanceRecordResponse mapToRecordResponseWithStudent(AttendanceRecordEntity r, String bearerToken) {

        AttendanceRecordResponse res = new AttendanceRecordResponse(

                r.getId(),

                r.getSessionId(),

                r.getStudentUserId(),

                r.getVerificationAttemptId(),

                r.getAttendanceStatus(),

                r.getDecision(),

                r.getMarkedAt()

        );



        if (r.getMarkedAt() != null) {

            res.setDate(r.getMarkedAt().toLocalDate().toString());

            res.setTime(r.getMarkedAt().toLocalTime().toString().substring(0, 5));

        }



        try {

            Map<String, Object> profile = studentServiceClient.getStudentById(r.getStudentUserId(), bearerToken);

            if (profile != null) {

                res.setStudentName(String.valueOf(profile.getOrDefault("fullName", profile.getOrDefault("name", ""))));

                res.setStudentRollNumber(String.valueOf(profile.getOrDefault("studentId", profile.getOrDefault("rollNumber", ""))));

                res.setDepartment(String.valueOf(profile.getOrDefault("department", "")));

                res.setSemester(String.valueOf(profile.getOrDefault("semester", profile.getOrDefault("year", ""))));

                res.setSection(String.valueOf(profile.getOrDefault("section", "")));

            }

        } catch (Exception ignored) {}



        return res;

    }



    @Transactional(readOnly = true)

    public List<FacultyReportResponse> getFacultyAttendanceReports(Long facultyUserId, String bearerToken) {

        List<AttendanceSessionEntity> sessions = sessionRepository.findByFacultyUserId(facultyUserId);

        List<FacultyReportResponse> reports = new ArrayList<>();



        List<Map<String, Object>> allStudents = studentServiceClient.getAllStudents(bearerToken);



        for (AttendanceSessionEntity s : sessions) {

            Map<String, Object> subjectDetails = null;

            try {

                subjectDetails = facultyServiceClient.getSubjectDetails(s.getSubjectId(), bearerToken);

            } catch (Exception ignored) {}



            String dept = subjectDetails != null && subjectDetails.get("department") != null ? String.valueOf(subjectDetails.get("department")) : "";

            String sem = subjectDetails != null && subjectDetails.get("semester") != null ? String.valueOf(subjectDetails.get("semester")) : "";

            String sec = subjectDetails != null && subjectDetails.get("section") != null ? String.valueOf(subjectDetails.get("section")) : "";



            List<AttendanceRecordResponse> participants = getSessionParticipants(s.getSessionId(), facultyUserId, bearerToken);

            int attended = participants.size();



            int eligibleCount = 0;

            if (allStudents != null && !allStudents.isEmpty() && !dept.isBlank()) {

                for (Map<String, Object> st : allStudents) {

                    String stDept = String.valueOf(st.getOrDefault("department", ""));

                    String stSem = String.valueOf(st.getOrDefault("semester", st.getOrDefault("year", "")));

                    String stSec = String.valueOf(st.getOrDefault("section", ""));

                    if (isDepartmentCompatible(dept, stDept) && isSemesterCompatible(sem, stSem) && isSectionCompatible(sec, stSec)) {

                        eligibleCount++;

                    }

                }

            }

            if (eligibleCount == 0) {

                eligibleCount = Math.max(attended, 1);

            }



            double percentage = Math.round((attended * 100.0 / eligibleCount) * 10.0) / 10.0;



            String realSubjectCode = subjectDetails != null && subjectDetails.get("subjectCode") != null

                    ? String.valueOf(subjectDetails.get("subjectCode"))

                    : resolveSubjectCode(s.getSubjectId(), bearerToken);



            reports.add(new FacultyReportResponse(

                    s.getSessionId(),

                    s.getSubjectId(),

                    realSubjectCode,

                    s.getSubjectName() != null ? s.getSubjectName() : realSubjectCode,

                    s.getSessionDate(),

                    s.getStartTime(),

                    s.getEndTime(),

                    60,

                    dept,

                    sem,

                    sec,

                    s.getStatus(),

                    attended,

                    eligibleCount,

                    percentage,

                    participants

            ));

        }



        reports.sort((a, b) -> b.getSessionId().compareTo(a.getSessionId()));

        return reports;

    }



    @Transactional

    public AttendanceSessionResponse startSession(Long id, Long facultyUserId) {

        return startSession(String.valueOf(id), facultyUserId);

    }



    @Transactional

    public AttendanceSessionResponse startSession(String idOrSessionId, Long facultyUserId) {

        AttendanceSessionEntity session = findSessionByIdOrSessionId(idOrSessionId);



        if (!session.getFacultyUserId().equals(facultyUserId)) {

            throw new AttendanceException("Access denied: You do not own this attendance session.", HttpStatus.FORBIDDEN);

        }



        if (session.getPlaintextQrToken() == null || session.getPlaintextQrToken().isBlank()) {

            String newPlaintext = "QR_" + UUID.randomUUID().toString();

            session.setPlaintextQrToken(newPlaintext);

            session.setQrTokenHash(hashQrToken(newPlaintext));

        }



        session.setStatus("LIVE");

        session.setQrIssuedAt(LocalDateTime.now());

        session.setQrExpiresAt(LocalDateTime.now().plusMinutes(60));

        AttendanceSessionEntity saved = sessionRepository.save(session);



        return mapToResponse(saved, saved.getPlaintextQrToken(), null, true);

    }



    @Transactional

    public AttendanceSessionResponse closeSession(Long id, Long facultyUserId) {

        return closeSession(String.valueOf(id), facultyUserId);

    }



    @Transactional

    public AttendanceSessionResponse closeSession(String idOrSessionId, Long facultyUserId) {

        AttendanceSessionEntity session = findSessionByIdOrSessionId(idOrSessionId);



        if (!session.getFacultyUserId().equals(facultyUserId)) {

            throw new AttendanceException("Access denied: You do not own this attendance session.", HttpStatus.FORBIDDEN);

        }



        session.setStatus("CLOSED");

        AttendanceSessionEntity saved = sessionRepository.save(session);



        return mapToResponse(saved, null, null, true);

    }



    public boolean isStudentEligibleForSubject(Long studentUserId, Map<String, Object> subjectDetails, String bearerToken) {

        if (studentUserId == null || bearerToken == null || bearerToken.isBlank()) {

            return false;

        }

        if (subjectDetails == null || subjectDetails.isEmpty()) {

            return false;

        }



        Map<String, Object> studentProfile = studentServiceClient.getStudentProfile(bearerToken);

        if (studentProfile == null || studentProfile.isEmpty()) {

            return false;

        }



        // 1. Department match

        String subjectDept = subjectDetails.get("department") != null ? String.valueOf(subjectDetails.get("department")).trim() : "";

        String studentDept = studentProfile.get("department") != null ? String.valueOf(studentProfile.get("department")).trim() : "";

        if (!isDepartmentCompatible(subjectDept, studentDept)) {

            return false;

        }



        // 2. Semester match

        String subjectSem = subjectDetails.get("semester") != null ? String.valueOf(subjectDetails.get("semester")).trim() : "";

        String studentSem = (studentProfile.get("semester") != null && !String.valueOf(studentProfile.get("semester")).isBlank())

                ? String.valueOf(studentProfile.get("semester")).trim()

                : (studentProfile.get("year") != null ? String.valueOf(studentProfile.get("year")).trim()

                : (studentProfile.get("academicYear") != null ? String.valueOf(studentProfile.get("academicYear")).trim() : ""));

        if (!isSemesterCompatible(subjectSem, studentSem)) {

            return false;

        }



        // 3. Section match

        String subjectSec = subjectDetails.get("section") != null ? String.valueOf(subjectDetails.get("section")).trim() : "";

        String studentSec = studentProfile.get("section") != null ? String.valueOf(studentProfile.get("section")).trim() : "";

        if (!isSectionCompatible(subjectSec, studentSec)) {

            return false;

        }



        return true;

    }



    private boolean isSemesterCompatible(String subjectSem, String studentSem) {

        if (subjectSem == null || studentSem == null || subjectSem.isBlank() || studentSem.isBlank()) {

            return false;

        }

        return subjectSem.trim().equalsIgnoreCase(studentSem.trim());

    }



    private boolean isSectionCompatible(String subjectSec, String studentSec) {

        if (subjectSec == null || studentSec == null || subjectSec.isBlank() || studentSec.isBlank()) {

            return false;

        }

        return subjectSec.trim().equalsIgnoreCase(studentSec.trim());

    }



    private boolean isDepartmentCompatible(String subjectDept, String studentDept) {

        if (subjectDept == null || studentDept == null || subjectDept.isBlank() || studentDept.isBlank()) {

            return false;

        }

        String s = subjectDept.trim().toUpperCase();

        String st = studentDept.trim().toUpperCase();



        if (s.equals(st)) {

            return true;

        }



        String normS = normalizeDeptCode(s);

        String normSt = normalizeDeptCode(st);



        return normS.equals(normSt);

    }



    private String normalizeDeptCode(String dept) {

        if (dept.contains("EEE") || dept.contains("ELECTRICAL")) return "EEE";

        if (dept.contains("CSE") || dept.contains("COMPUTER")) return "CSE";

        if (dept.contains("ECE") || dept.contains("ELECTRONICS") || dept.contains("COMMUNICATION")) return "ECE";

        if (dept.contains("MECH") || dept.contains("MECHANICAL")) return "MECH";

        if (dept.contains("CIVIL")) return "CIVIL";

        return dept;

    }



    @Transactional

    public List<AttendanceSessionResponse> getStudentLiveSessions(Long studentUserId, String bearerToken) {

        ZonedDateTime nowIst = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));

        List<AttendanceSessionEntity> candidates = sessionRepository.findByStatusIn(Arrays.asList("LIVE", "ACTIVE", "CREATED"));

        List<AttendanceSessionEntity> validSessions = new ArrayList<>();



        for (AttendanceSessionEntity s : candidates) {

            if (s.isExpired(nowIst)) {

                s.setStatus("CLOSED");

                sessionRepository.save(s);

            } else if (!s.isScheduled(nowIst)) {

                if ("CREATED".equals(s.getStatus())) {

                    s.setStatus("LIVE");

                    sessionRepository.save(s);

                }

                validSessions.add(s);

            }

        }



        List<AttendanceSessionResponse> eligibleSessions = new ArrayList<>();

        for (AttendanceSessionEntity s : validSessions) {

            try {

                Map<String, Object> subjectDetails = facultyServiceClient.getSubjectDetails(s.getSubjectId(), bearerToken);

                if (isStudentEligibleForSubject(studentUserId, subjectDetails, bearerToken)) {

                    eligibleSessions.add(mapToResponse(s, null, s.getSubjectCode(), false));

                }

            } catch (Exception ex) {

                // If subject detail resolution fails, fallback safely

            }

        }



        return eligibleSessions;

    }



    @Transactional

    public QrValidationResponse verifyQr(VerifyQrRequest request, Long studentUserId, String bearerToken) {

        if (request.getQrToken() == null || request.getQrToken().isBlank()) {

            throw new AttendanceException("QR token is required for verification.", HttpStatus.BAD_REQUEST);

        }



        String inputHash = hashQrToken(request.getQrToken().trim());



        AttendanceSessionEntity session = sessionRepository.findAll().stream()

                .filter(s -> inputHash.equals(s.getQrTokenHash()))

                .findFirst()

                .orElseThrow(() -> new AttendanceException("Invalid or unrecognized QR token.", HttpStatus.BAD_REQUEST));



        if (request.getSessionId() != null && !request.getSessionId().isBlank()) {

            if (!session.getSessionId().equalsIgnoreCase(request.getSessionId().trim())) {

                throw new AttendanceException("QR token does not belong to the specified session.", HttpStatus.BAD_REQUEST);

            }

        }



        // Verify Student Subject Eligibility BEFORE QR_VALID

        Map<String, Object> subjectDetails = facultyServiceClient.getSubjectDetails(session.getSubjectId(), bearerToken);

        if (!isStudentEligibleForSubject(studentUserId, subjectDetails, bearerToken)) {

            throw new AttendanceException("Access Denied: You are not enrolled or eligible to attend sessions for this subject/department.", HttpStatus.FORBIDDEN);

        }



        return processAttendanceEntry(session, studentUserId, bearerToken);

    }



    @Transactional

    public QrValidationResponse verifyCode(VerifyCodeRequest request, Long studentUserId, String bearerToken) {

        if (request.getAttendanceCode() == null || request.getAttendanceCode().isBlank()) {

            throw new AttendanceException("Attendance code is required.", HttpStatus.BAD_REQUEST);

        }



        String inputCode = request.getAttendanceCode().trim();



        AttendanceSessionEntity session = sessionRepository.findAll().stream()

                .filter(s -> ("LIVE".equals(s.getStatus()) || "ACTIVE".equals(s.getStatus())) && inputCode.equals(s.getAttendanceCode()))

                .findFirst()

                .orElseThrow(() -> new AttendanceException("Invalid, closed, or expired attendance code.", HttpStatus.BAD_REQUEST));



        return processAttendanceEntry(session, studentUserId, bearerToken);

    }



    private QrValidationResponse processAttendanceEntry(AttendanceSessionEntity session, Long studentUserId, String bearerToken) {

        ZonedDateTime nowIst = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));



        if (session.isExpired(nowIst) || "CLOSED".equalsIgnoreCase(session.getStatus()) || "EXPIRED".equalsIgnoreCase(session.getStatus())) {

            if (!"CLOSED".equals(session.getStatus())) {

                session.setStatus("CLOSED");

                sessionRepository.save(session);

            }

            throw new AttendanceException("Attendance session has expired.", HttpStatus.BAD_REQUEST);

        }



        if (!"LIVE".equals(session.getStatus()) && !"ACTIVE".equals(session.getStatus())) {

            throw new AttendanceException("Attendance session is not active (Status: " + session.getStatus() + ").", HttpStatus.BAD_REQUEST);

        }



        if (session.getQrExpiresAt() != null && LocalDateTime.now().isAfter(session.getQrExpiresAt())) {

            session.setStatus("EXPIRED");

            sessionRepository.save(session);

            throw new AttendanceException("Attendance session / code has expired.", HttpStatus.BAD_REQUEST);

        }



        // Check duplicate attendance

        if (recordRepository.existsBySessionIdAndStudentUserId(session.getSessionId(), studentUserId)) {

            throw new AttendanceException("Duplicate attendance attempt: You have already submitted attendance for this session.", HttpStatus.CONFLICT);

        }



        // Create verification attempt

        String attemptId = "ATTEMPT_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        AttendanceVerificationAttemptEntity attempt = new AttendanceVerificationAttemptEntity(

                attemptId,

                session.getSessionId(),

                studentUserId

        );

        verificationAttemptRepository.save(attempt);



        // Create attendance record in PENDING state

        AttendanceRecordEntity record = new AttendanceRecordEntity(

                session.getSessionId(),

                studentUserId,

                attemptId

        );

        recordRepository.save(record);



        // Perform initial fraud assessment for QR/Code entry

        evaluateAndUpdateRecord(attempt, bearerToken);



        return new QrValidationResponse(

                attempt.getAttemptId(),

                session.getSessionId(),

                attempt.getQrStatus(),

                attempt.getFaceStatus(),

                attempt.getLocationStatus(),

                attempt.getDeviceStatus(),

                attempt.getOverallStatus()

        );

    }



    @Transactional

    public QrValidationResponse updateVerificationAttemptSignals(String sessionId, Long studentUserId,

                                                                   String faceStatus, String deviceStatus, String locationStatus,

                                                                   String bearerToken) {

        AttendanceSessionEntity session = findSessionByIdOrSessionId(sessionId);

        ZonedDateTime nowIst = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));

        if (session.isExpired(nowIst)) {

            throw new AttendanceException("Attendance session has closed or expired. Cannot submit attendance.", HttpStatus.BAD_REQUEST);

        }



        AttendanceVerificationAttemptEntity attempt = verificationAttemptRepository.findTopBySessionIdAndStudentUserIdOrderByIdDesc(sessionId, studentUserId)

                .orElseGet(() -> {

                    String attemptId = "ATTEMPT_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

                    AttendanceVerificationAttemptEntity newAttempt = new AttendanceVerificationAttemptEntity(attemptId, sessionId, studentUserId);

                    return verificationAttemptRepository.save(newAttempt);

                });



        if (faceStatus != null) attempt.setFaceStatus(faceStatus);

        if (deviceStatus != null) attempt.setDeviceStatus(deviceStatus);

        if (locationStatus != null) attempt.setLocationStatus(locationStatus);



        attempt.setUpdatedAt(LocalDateTime.now());

        AttendanceVerificationAttemptEntity saved = verificationAttemptRepository.save(attempt);



        evaluateAndUpdateRecord(saved, bearerToken);



        return new QrValidationResponse(

                saved.getAttemptId(),

                saved.getSessionId(),

                saved.getQrStatus(),

                saved.getFaceStatus(),

                saved.getLocationStatus(),

                saved.getDeviceStatus(),

                saved.getOverallStatus()

        );

    }



    @Transactional

    public QrValidationResponse updateLocationStatus(String sessionId, Long studentUserId, String locationStatus, String bearerToken) {

        return updateVerificationAttemptSignals(sessionId, studentUserId, null, null, locationStatus, bearerToken);

    }



    public void evaluateAndUpdateRecord(AttendanceVerificationAttemptEntity attempt, String bearerToken) {

        Map<String, Object> req = Map.of(

                "attemptId", attempt.getAttemptId(),

                "sessionId", attempt.getSessionId(),

                "studentUserId", attempt.getStudentUserId(),

                "qrStatus", attempt.getQrStatus() != null ? attempt.getQrStatus() : "NOT_AVAILABLE",

                "faceStatus", attempt.getFaceStatus() != null ? attempt.getFaceStatus() : "NOT_AVAILABLE",

                "deviceStatus", attempt.getDeviceStatus() != null ? attempt.getDeviceStatus() : "NOT_AVAILABLE",

                "locationStatus", attempt.getLocationStatus() != null ? attempt.getLocationStatus() : "NOT_AVAILABLE"

        );



        Map<String, Object> evalRes = fraudServiceClient.evaluateFraud(req, bearerToken);

        String decision = String.valueOf(evalRes.getOrDefault("decision", "PENDING"));



        attempt.setOverallStatus(decision);

        verificationAttemptRepository.save(attempt);



        Optional<AttendanceRecordEntity> recordOpt = recordRepository.findByVerificationAttemptId(attempt.getAttemptId())

                .or(() -> recordRepository.findTopBySessionIdAndStudentUserIdOrderByIdDesc(attempt.getSessionId(), attempt.getStudentUserId()));



        if (recordOpt.isPresent()) {

            AttendanceRecordEntity record = recordOpt.get();

            record.setDecision(decision);

            if ("SAFE".equalsIgnoreCase(decision)) {

                record.setAttendanceStatus("PRESENT");

            } else if ("SUSPICIOUS".equalsIgnoreCase(decision)) {

                record.setAttendanceStatus("SUSPICIOUS");

            } else if ("REJECTED".equalsIgnoreCase(decision)) {

                record.setAttendanceStatus("REJECTED");

            } else {

                record.setAttendanceStatus("PENDING");

            }

            recordRepository.save(record);

        } else {

            try {

                AttendanceRecordEntity newRec = new AttendanceRecordEntity(attempt.getSessionId(), attempt.getStudentUserId(), attempt.getAttemptId());

                newRec.setDecision(decision);

                newRec.setAttendanceStatus("SAFE".equalsIgnoreCase(decision) ? "PRESENT" : ("REJECTED".equalsIgnoreCase(decision) ? "REJECTED" : ("SUSPICIOUS".equalsIgnoreCase(decision) ? "SUSPICIOUS" : "PENDING")));

                recordRepository.save(newRec);

            } catch (Exception ex) {

                recordRepository.findTopBySessionIdAndStudentUserIdOrderByIdDesc(attempt.getSessionId(), attempt.getStudentUserId()).ifPresent(rec -> {

                    rec.setDecision(decision);

                    rec.setAttendanceStatus("SAFE".equalsIgnoreCase(decision) ? "PRESENT" : ("REJECTED".equalsIgnoreCase(decision) ? "REJECTED" : ("SUSPICIOUS".equalsIgnoreCase(decision) ? "SUSPICIOUS" : "PENDING")));

                    recordRepository.save(rec);

                });

            }

        }

    }



    @Transactional(readOnly = true)

    public List<AttendanceRecordResponse> getStudentHistory(Long studentUserId) {

        return recordRepository.findByStudentUserId(studentUserId).stream()

                .map(r -> {

                    String subjectCode = r.getSessionId();

                    String subjectName = "Class Session";

                    String date = r.getMarkedAt() != null ? r.getMarkedAt().toLocalDate().toString() : "";

                    String time = r.getMarkedAt() != null ? r.getMarkedAt().toLocalTime().toString().substring(0, 5) : "";

                    String verStatus = "PENDING";

                    String fraudStatus = r.getDecision() != null ? r.getDecision() : "SAFE";



                    if (r.getSessionId() != null) {

                        var sessionOpt = sessionRepository.findBySessionId(r.getSessionId())

                                .or(() -> {

                                    try {

                                        return sessionRepository.findById(Long.parseLong(r.getSessionId()));

                                    } catch (Exception e) {

                                        return java.util.Optional.empty();

                                    }

                                });

                        if (sessionOpt.isPresent()) {

                            var s = sessionOpt.get();

                            subjectCode = (s.getSubjectCode() != null && !s.getSubjectCode().isBlank()) ? s.getSubjectCode() : resolveSubjectCode(s.getSubjectId(), null);

                            subjectName = s.getSubjectName() != null ? s.getSubjectName() : subjectCode;

                            if (s.getSessionDate() != null) date = s.getSessionDate();

                            if (s.getStartTime() != null) time = s.getStartTime();

                        }

                    }



                    if (r.getVerificationAttemptId() != null) {

                        var attemptOpt = verificationAttemptRepository.findByAttemptId(r.getVerificationAttemptId());

                        if (attemptOpt.isPresent()) {

                            var att = attemptOpt.get();

                            verStatus = att.getOverallStatus() != null ? att.getOverallStatus() : "PENDING";

                            if ("SAFE".equalsIgnoreCase(verStatus) || "PRESENT".equalsIgnoreCase(r.getAttendanceStatus())) {

                                verStatus = "VERIFIED";

                            }

                        } else if ("PRESENT".equalsIgnoreCase(r.getAttendanceStatus())) {

                            verStatus = "VERIFIED";

                        }

                    } else if ("PRESENT".equalsIgnoreCase(r.getAttendanceStatus())) {

                        verStatus = "VERIFIED";

                    }



                    return new AttendanceRecordResponse(

                            r.getId(),

                            r.getSessionId(),

                            r.getStudentUserId(),

                            r.getVerificationAttemptId(),

                            r.getAttendanceStatus(),

                            r.getDecision(),

                            subjectCode,

                            subjectName,

                            verStatus,

                            fraudStatus,

                            date,

                            time,

                            r.getMarkedAt()

                    );

                })

                .collect(Collectors.toList());

    }



    private String resolveSubjectCode(String subjectId, String bearerToken) {

        if (subjectId == null || subjectId.isBlank()) return "";

        try {

            Map<String, Object> details = facultyServiceClient.getSubjectDetails(subjectId, bearerToken);

            if (details != null && details.get("subjectCode") != null) {

                String code = String.valueOf(details.get("subjectCode")).trim();

                if (!code.isBlank()) return code;

            }

        } catch (Exception ignored) {}

        return subjectId;

    }



    @Transactional(readOnly = true)

    public AttendanceSessionResponse getSessionBySessionId(String idOrSessionId) {

        AttendanceSessionEntity session = findSessionByIdOrSessionId(idOrSessionId);

        return mapToResponse(session, null, null, false);

    }



    private String hashQrToken(String token) {

        try {

            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {

                String hex = Integer.toHexString(0xff & b);

                if (hex.length() == 1) hexString.append('0');

                hexString.append(hex);

            }

            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {

            throw new RuntimeException("SHA-256 algorithm not available", e);

        }

    }



    private AttendanceSessionResponse mapToResponse(AttendanceSessionEntity entity, String plaintextQrToken, String subjectCode, boolean isFacultyOwner) {

        String tokenToReturn = plaintextQrToken != null ? plaintextQrToken : entity.getPlaintextQrToken();

        String resolvedCode = (subjectCode != null && !subjectCode.isBlank()) ? subjectCode : resolveSubjectCode(entity.getSubjectId(), null);

        AttendanceSessionResponse res = new AttendanceSessionResponse(

                entity.getId(),

                entity.getSessionId(),

                entity.getFacultyUserId(),

                entity.getSubjectId(),

                resolvedCode,

                entity.getSubjectName(),

                entity.getSessionDate(),

                entity.getStartTime(),

                entity.getEndTime(),

                entity.getStatus(),

                tokenToReturn,

                isFacultyOwner ? entity.getAttendanceCode() : null,

                entity.getLatitude(),

                entity.getLongitude(),

                entity.getAllowedRadiusMeters(),

                entity.getQrExpiresAt(),

                entity.getCreatedAt()

        );



        if (entity.getQrExpiresAt() != null) {

            ZonedDateTime expZdt = entity.getQrExpiresAt().atZone(ZoneId.of("Asia/Kolkata"));

            res.setEndAt(expZdt.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        } else if (entity.calculateEndDateTime() != null) {

            res.setEndAt(entity.calculateEndDateTime().format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        }



        if (entity.getCreatedAt() != null) {

            ZonedDateTime createZdt = entity.getCreatedAt().atZone(ZoneId.of("Asia/Kolkata"));

            res.setStartAt(createZdt.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        } else if (entity.calculateStartDateTime() != null) {

            res.setStartAt(entity.calculateStartDateTime().format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        }



        return res;

    }



    @Scheduled(fixedDelayString = "${session.expiration.check.interval.ms:5000}")

    @Transactional

    public void autoExpireSessions() {

        try {

            ZonedDateTime nowIst = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));

            List<AttendanceSessionEntity> activeSessions = sessionRepository.findByStatusIn(Arrays.asList("LIVE", "ACTIVE", "CREATED"));

            for (AttendanceSessionEntity s : activeSessions) {

                if (s.isExpired(nowIst)) {

                    s.setStatus("CLOSED");

                    sessionRepository.save(s);

                }

            }

        } catch (Exception ignored) {}

    }

}
