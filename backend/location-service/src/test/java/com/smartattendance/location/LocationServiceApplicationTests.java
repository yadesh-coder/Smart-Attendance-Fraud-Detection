package com.smartattendance.location;

import com.smartattendance.location.dto.AttendanceSessionDto;
import com.smartattendance.location.service.AttendanceServiceClient;
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

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LocationServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AttendanceServiceClient attendanceServiceClient;

    private String studentToken;
    private String facultyToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        studentToken = "Bearer " + generateTestToken("101", "student.loc@college.edu", "STUDENT");
        facultyToken = "Bearer " + generateTestToken("202", "faculty.loc@college.edu", "FACULTY");
        adminToken = "Bearer " + generateTestToken("303", "admin@college.edu", "ADMIN");

        AttendanceSessionDto liveSession = new AttendanceSessionDto();
        liveSession.setSessionId("SESS_LIVE_001");
        liveSession.setStatus("LIVE");
        liveSession.setLatitude(12.9716);
        liveSession.setLongitude(77.5946);
        liveSession.setAllowedRadiusMeters(100.0);

        AttendanceSessionDto closedSession = new AttendanceSessionDto();
        closedSession.setSessionId("SESS_CLOSED_002");
        closedSession.setStatus("CLOSED");
        closedSession.setLatitude(12.9716);
        closedSession.setLongitude(77.5946);
        closedSession.setAllowedRadiusMeters(100.0);

        AttendanceSessionDto expiredSession = new AttendanceSessionDto();
        expiredSession.setSessionId("SESS_EXPIRED_003");
        expiredSession.setStatus("EXPIRED");
        expiredSession.setLatitude(12.9716);
        expiredSession.setLongitude(77.5946);
        expiredSession.setAllowedRadiusMeters(100.0);

        Mockito.when(attendanceServiceClient.getAttendanceSession(Mockito.eq("SESS_LIVE_001"), anyString()))
                .thenReturn(liveSession);
        Mockito.when(attendanceServiceClient.getAttendanceSession(Mockito.eq("SESS_CLOSED_002"), anyString()))
                .thenReturn(closedSession);
        Mockito.when(attendanceServiceClient.getAttendanceSession(Mockito.eq("SESS_EXPIRED_003"), anyString()))
                .thenReturn(expiredSession);
        Mockito.when(attendanceServiceClient.getAttendanceSession(Mockito.eq("SESS_NON_EXISTENT"), anyString()))
                .thenReturn(null);

        Mockito.when(attendanceServiceClient.updateLocationStatus(anyString(), anyLong(), anyString(), anyString()))
                .thenReturn(true);
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
    void test1_ValidLocationInsideRadius_ReturnsSuccess() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOCATION_VALID"))
                .andExpect(jsonPath("$.verified").value(true));
    }

    @Test
    void test2_LocationOutsideRadius_ReturnsOutsideRadius() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":13.0827,\"longitude\":80.2707,\"accuracy\":15.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOCATION_OUTSIDE_RADIUS"))
                .andExpect(jsonPath("$.verified").value(false));
    }

    @Test
    void test3_InvalidLatitude_Returns400() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":999.0,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Latitude must be between -90 and 90 degrees."));
    }

    @Test
    void test4_InvalidLongitude_Returns400() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":12.9716,\"longitude\":999.0,\"accuracy\":15.0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Longitude must be between -180 and 180 degrees."));
    }

    @Test
    void test5_UnauthenticatedRequest_Returns401() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test6_FacultyRequest_Returns403() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void test7_AdminRequest_Returns403() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void test8_NonExistentSession_Returns404() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_NON_EXISTENT\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void test9_ClosedSession_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_CLOSED_002\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Attendance session is not active (Status: CLOSED)."));
    }

    @Test
    void test10_ExpiredSession_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_EXPIRED_003\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Attendance session is not active (Status: EXPIRED)."));
    }

    @Test
    void test11_PoorAccuracy_ReturnsAccuracyInsufficient() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":500.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOCATION_ACCURACY_INSUFFICIENT"))
                .andExpect(jsonPath("$.verified").value(false));
    }

    @Test
    void test12_PrivacyCheck_NoRawCoordinatesInResponse() throws Exception {
        mockMvc.perform(post("/api/student/location/verify")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"SESS_LIVE_001\",\"latitude\":12.9716,\"longitude\":77.5946,\"accuracy\":15.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latitude").doesNotExist())
                .andExpect(jsonPath("$.longitude").doesNotExist())
                .andExpect(jsonPath("$.studentLocationHistory").doesNotExist());
    }
}
