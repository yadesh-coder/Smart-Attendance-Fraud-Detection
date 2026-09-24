package com.smartattendance.fraud;

import com.smartattendance.fraud.dto.EvaluateFraudRequest;
import com.smartattendance.fraud.repository.FraudAssessmentRepository;
import com.smartattendance.fraud.repository.TriggeredRuleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FraudServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FraudAssessmentRepository assessmentRepository;

    @Autowired
    private TriggeredRuleRepository ruleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String student1Token;
    private String student2Token;
    private String facultyToken;

    @BeforeEach
    void setUp() {
        ruleRepository.deleteAll();
        assessmentRepository.deleteAll();

        student1Token = "Bearer " + generateTestToken("100", "student1@college.edu", "STUDENT");
        student2Token = "Bearer " + generateTestToken("200", "student2@college.edu", "STUDENT");
        facultyToken = "Bearer " + generateTestToken("300", "faculty@college.edu", "FACULTY");
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
    void test1_AllValidSignalsReturnsSafe() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_001", "SESS_001", 100L,
                "QR_VALID", "FACE_MATCH", "DEVICE_RECOGNIZED", "LOCATION_VALID"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("SAFE")))
                .andExpect(jsonPath("$.riskLevel", is("LOW")))
                .andExpect(jsonPath("$.triggeredRules", hasSize(0)));
    }

    @Test
    void test2_InvalidQrReturnsRejected() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_002", "SESS_001", 100L,
                "INVALID", "FACE_MATCH", "DEVICE_RECOGNIZED", "LOCATION_VALID"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("REJECTED")))
                .andExpect(jsonPath("$.riskLevel", is("CRITICAL")))
                .andExpect(jsonPath("$.triggeredRules[0].ruleCode", is("R1_INVALID_QR_CODE")));
    }

    @Test
    void test3_FaceMismatchReturnsRejected() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_003", "SESS_001", 100L,
                "QR_VALID", "FACE_MISMATCH", "DEVICE_RECOGNIZED", "LOCATION_VALID"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("REJECTED")))
                .andExpect(jsonPath("$.riskLevel", is("CRITICAL")))
                .andExpect(jsonPath("$.triggeredRules[0].ruleCode", is("R2_FACE_MISMATCH")));
    }

    @Test
    void test4_UnenrolledFaceReturnsRejected() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_004", "SESS_001", 100L,
                "QR_VALID", "NOT_ENROLLED", "DEVICE_RECOGNIZED", "LOCATION_VALID"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("REJECTED")))
                .andExpect(jsonPath("$.riskLevel", is("CRITICAL")))
                .andExpect(jsonPath("$.triggeredRules[0].ruleCode", is("R3_UNENROLLED_FACE")));
    }

    @Test
    void test5_InvalidLocationReturnsRejected() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_005", "SESS_001", 100L,
                "QR_VALID", "FACE_MATCH", "DEVICE_RECOGNIZED", "OUT_OF_BOUNDS"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("REJECTED")))
                .andExpect(jsonPath("$.riskLevel", is("CRITICAL")))
                .andExpect(jsonPath("$.triggeredRules[0].ruleCode", is("R4_LOCATION_OUT_OF_BOUNDS")));
    }

    @Test
    void test6_DeviceMismatchReturnsRejected() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_006", "SESS_001", 100L,
                "QR_VALID", "FACE_MATCH", "DEVICE_MISMATCH", "LOCATION_VALID"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("REJECTED")))
                .andExpect(jsonPath("$.riskLevel", is("CRITICAL")))
                .andExpect(jsonPath("$.triggeredRules[0].ruleCode", is("R5_DEVICE_MISMATCH")));
    }

    @Test
    void test7_NewDeviceReturnsSuspicious() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_007", "SESS_001", 100L,
                "QR_VALID", "FACE_MATCH", "NEW_DEVICE", "LOCATION_VALID"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("SUSPICIOUS")))
                .andExpect(jsonPath("$.riskLevel", is("HIGH")))
                .andExpect(jsonPath("$.triggeredRules[0].ruleCode", is("R6_NEW_DEVICE")));
    }

    @Test
    void test8_MissingVerificationSignalsReturnsPending() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_008", "SESS_001", 100L,
                "QR_VALID", "NOT_AVAILABLE", "NOT_AVAILABLE", "NOT_AVAILABLE"
        );

        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("PENDING")))
                .andExpect(jsonPath("$.triggeredRules[0].ruleCode", is("R7_INCOMPLETE_PIPELINE")));
    }

    @Test
    void test9_StudentCrossAccountAccessIsForbidden() throws Exception {
        EvaluateFraudRequest request = new EvaluateFraudRequest(
                "ATTEMPT_009", "SESS_001", 100L,
                "QR_VALID", "FACE_MATCH", "DEVICE_RECOGNIZED", "LOCATION_VALID"
        );
        mockMvc.perform(post("/api/fraud/evaluate")
                .header("Authorization", student1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Student 2 attempts to query Student 1's assessment
        mockMvc.perform(get("/api/fraud/assessments/attempt/ATTEMPT_009")
                .header("Authorization", student2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    void test10_UnauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/fraud/assessments/attempt/ATTEMPT_010"))
                .andExpect(status().isUnauthorized());
    }
}
