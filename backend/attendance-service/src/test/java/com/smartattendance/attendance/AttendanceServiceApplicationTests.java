package com.smartattendance.attendance;

import com.smartattendance.attendance.dto.AttendanceSessionResponse;
import com.smartattendance.attendance.dto.CreateSessionRequest;
import com.smartattendance.attendance.repository.AttendanceRecordRepository;
import com.smartattendance.attendance.repository.AttendanceSessionRepository;
import com.smartattendance.attendance.repository.AttendanceVerificationAttemptRepository;
import com.smartattendance.attendance.service.AttendanceService;
import com.smartattendance.attendance.service.FacultyServiceClient;
import com.smartattendance.attendance.service.FraudServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AttendanceServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AttendanceSessionRepository sessionRepository;

    @Autowired
    private AttendanceVerificationAttemptRepository verificationAttemptRepository;

    @Autowired
    private AttendanceRecordRepository recordRepository;

    @Autowired
    private AttendanceService attendanceService;

    @MockBean
    private FacultyServiceClient facultyServiceClient;

    @MockBean
    private FraudServiceClient fraudServiceClient;

    private String adminToken;
    private String facultyToken;
    private String faculty2Token;
    private String studentToken;

    @BeforeEach
    void setUp() {
        recordRepository.deleteAll();
        verificationAttemptRepository.deleteAll();
        sessionRepository.deleteAll();

        adminToken = "Bearer " + generateTestToken("1", "admin@college.edu", "ADMIN");
        facultyToken = "Bearer " + generateTestToken("2", "faculty@college.edu", "FACULTY");
        faculty2Token = "Bearer " + generateTestToken("22", "faculty2@college.edu", "FACULTY");
        studentToken = "Bearer " + generateTestToken("3", "student@college.edu", "STUDENT");

        Map<String, Object> activeFacultyMap = Map.of("status", "ACTIVE", "userId", 2L);
        Map<String, Object> subjectMap = Map.of("subjectId", "SUB101", "subjectCode", "CS101", "subjectName", "Data Structures", "status", "ACTIVE", "facultyUserId", 2L);

        Mockito.when(facultyServiceClient.getFacultyProfile(anyString())).thenReturn(activeFacultyMap);
        Mockito.when(facultyServiceClient.getSubjectDetails(anyString(), anyString())).thenReturn(subjectMap);
        Mockito.when(fraudServiceClient.evaluateFraud(any(), any())).thenReturn(Map.of("decision", "PENDING", "riskLevel", "LOW"));
    }

    private String generateTestToken(String userId, String email, String role) {
        return io.jsonwebtoken.Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .expiration(new java.util.Date(System.currentTimeMillis() + 3600000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor("smart_attendance_fraud_detection_jwt_secret_key_32bytes_minimum".getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                .compact();
    }

    @Test
    void test1_FacultyCreatesSessionSuccessfully() throws Exception {
        String json = """
                {
                    "subjectId": "SUB101",
                    "subjectName": "Data Structures",
                    "sessionDate": "2026-08-13",
                    "startTime": "10:00",
                    "endTime": "11:00"
                }
                """;

        mockMvc.perform(post("/api/faculty/attendance/sessions")
                .header("Authorization", facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionId", notNullValue()))
                .andExpect(jsonPath("$.subjectId", is("SUB101")))
                .andExpect(jsonPath("$.qrToken", notNullValue()))
                .andExpect(jsonPath("$.attendanceCode", notNullValue()))
                .andExpect(jsonPath("$.status", is("CREATED")));
    }

    @Test
    void test2_StudentCannotCreateSession() throws Exception {
        mockMvc.perform(post("/api/faculty/attendance/sessions")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"subjectId\":\"SUB101\",\"sessionDate\":\"2026-08-13\",\"startTime\":\"10:00\",\"endTime\":\"11:00\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void test3_AdminCannotCreateSession() throws Exception {
        mockMvc.perform(post("/api/faculty/attendance/sessions")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"subjectId\":\"SUB101\",\"sessionDate\":\"2026-08-13\",\"startTime\":\"10:00\",\"endTime\":\"11:00\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void test4_UnauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(post("/api/faculty/attendance/sessions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test5_FacultyStartsOwnSessionSuccessfully() throws Exception {
        AttendanceSessionResponse created = attendanceService.createSession(
                new CreateSessionRequest("SUB101", "Math", "2026-08-13", "10:00", "11:00"), 2L, facultyToken);

        mockMvc.perform(post("/api/faculty/attendance/sessions/" + created.getId() + "/start")
                .header("Authorization", facultyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("LIVE")))
                .andExpect(jsonPath("$.qrExpiresAt", notNullValue()));
    }

    @Test
    void test6_FacultyClosesOwnSessionSuccessfully() throws Exception {
        AttendanceSessionResponse created = attendanceService.createSession(
                new CreateSessionRequest("SUB101", "Math", "2026-08-13", "10:00", "11:00"), 2L, facultyToken);

        mockMvc.perform(post("/api/faculty/attendance/sessions/" + created.getId() + "/close")
                .header("Authorization", facultyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CLOSED")));
    }

    @Test
    void test7_FacultyCannotModifyAnotherFacultySession() throws Exception {
        AttendanceSessionResponse createdByFaculty1 = attendanceService.createSession(
                new CreateSessionRequest("SUB101", "Math", "2026-08-13", "10:00", "11:00"), 2L, facultyToken);

        mockMvc.perform(post("/api/faculty/attendance/sessions/" + createdByFaculty1.getId() + "/start")
                .header("Authorization", faculty2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    void test8_EachCreatedSessionReceivesADifferentQrToken() throws Exception {
        AttendanceSessionResponse s1 = attendanceService.createSession(
                new CreateSessionRequest("SUB101", "Math", "2026-08-13", "10:00", "11:00"), 2L, facultyToken);
        AttendanceSessionResponse s2 = attendanceService.createSession(
                new CreateSessionRequest("SUB101", "Physics", "2026-08-13", "11:00", "12:00"), 2L, facultyToken);

        org.junit.jupiter.api.Assertions.assertNotEquals(s1.getQrToken(), s2.getQrToken());
    }

    @Test
    void test9_StudentCanValidateValidManualCode() throws Exception {
        AttendanceSessionResponse created = attendanceService.createSession(
                new CreateSessionRequest("SUB101", "Math", "2026-08-13", "10:00", "11:00"), 2L, facultyToken);
        attendanceService.startSession(created.getId(), 2L);

        mockMvc.perform(post("/api/student/attendance/verify-code")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"attendanceCode\":\"" + created.getAttendanceCode() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrStatus", is("QR_VALID")))
                .andExpect(jsonPath("$.verificationAttemptId", notNullValue()));
    }

    @Test
    void test10_InvalidManualCodeIsRejected() throws Exception {
        mockMvc.perform(post("/api/student/attendance/verify-code")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"attendanceCode\":\"999999\"}"))
                .andExpect(status().isBadRequest());
    }
}
