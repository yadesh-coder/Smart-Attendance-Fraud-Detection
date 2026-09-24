package com.smartattendance.device;



import com.smartattendance.device.config.JwtTokenProvider;

import com.smartattendance.device.service.StudentServiceClient;

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



import static org.mockito.ArgumentMatchers.anyString;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;



@SpringBootTest

@AutoConfigureMockMvc

@ActiveProfiles("test")

class DeviceServiceApplicationTests {



    @Autowired

    private MockMvc mockMvc;



    @Autowired

    private JwtTokenProvider tokenProvider;



    @MockBean

    private StudentServiceClient studentServiceClient;



    private String studentToken;

    private String student2Token;

    private String facultyToken;

    private String adminToken;



    @BeforeEach

    void setUp() {

        studentToken = "Bearer " + generateTestToken("101", "student.device1@college.edu", "STUDENT");

        student2Token = "Bearer " + generateTestToken("102", "student.device2@college.edu", "STUDENT");

        facultyToken = "Bearer " + generateTestToken("202", "faculty.bob@college.edu", "FACULTY");

        adminToken = "Bearer " + generateTestToken("303", "admin@college.edu", "ADMIN");



        Mockito.when(studentServiceClient.registerDeviceEnrollment(anyString(), anyString(), anyString()))

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

    void test1_UnauthenticatedRequestIsRejectedWith401() throws Exception {

        mockMvc.perform(post("/api/student/device/enroll")

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{\"userAgent\":\"Mozilla/5.0\",\"platform\":\"Win32\",\"screenDimensions\":\"1920x1080x24\"}"))

                .andExpect(status().isUnauthorized());

    }



    @Test

    void test2_FacultyRequestIsRejectedWith403() throws Exception {

        mockMvc.perform(post("/api/student/device/enroll")

                        .header("Authorization", facultyToken)

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{\"userAgent\":\"Mozilla/5.0\",\"platform\":\"Win32\",\"screenDimensions\":\"1920x1080x24\"}"))

                .andExpect(status().isForbidden());

    }



    @Test

    void test3_AdminRequestIsRejectedWith403() throws Exception {

        mockMvc.perform(post("/api/student/device/enroll")

                        .header("Authorization", adminToken)

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{\"userAgent\":\"Mozilla/5.0\",\"platform\":\"Win32\",\"screenDimensions\":\"1920x1080x24\"}"))

                .andExpect(status().isForbidden());

    }



    @Test

    void test4_InvalidDevicePayloadIsRejectedWith400() throws Exception {

        mockMvc.perform(post("/api/student/device/enroll")

                        .header("Authorization", studentToken)

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{}"))

                .andExpect(status().isBadRequest())

                .andExpect(jsonPath("$.message").value("Invalid or incomplete device signal payload."));

    }



    @Test

    void test5_ValidStudentDeviceEnrollmentSucceeds() throws Exception {

        mockMvc.perform(post("/api/student/device/enroll")

                        .header("Authorization", studentToken)

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64)\",\"platform\":\"Win32\",\"screenDimensions\":\"1920x1080x24\",\"timezone\":\"UTC\",\"deviceLabel\":\"My Windows Laptop\"}"))

                .andExpect(status().isOk())

                .andExpect(jsonPath("$.status").value("COMPLETED"))

                .andExpect(jsonPath("$.enrolled").value(true))

                .andExpect(jsonPath("$.deviceFingerprintHash").doesNotExist())

                .andExpect(jsonPath("$.rawDeviceSignals").doesNotExist())

                .andExpect(jsonPath("$.macAddress").doesNotExist())

                .andExpect(jsonPath("$.imei").doesNotExist())

                .andExpect(jsonPath("$.serialNumber").doesNotExist());

    }



    @Test

    void test6_ReEnrollmentBySameStudentUpdatesSuccessfully() throws Exception {

        mockMvc.perform(post("/api/student/device/enroll")

                        .header("Authorization", studentToken)

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64)\",\"platform\":\"Win32\",\"screenDimensions\":\"1920x1080x24\",\"timezone\":\"UTC\",\"deviceLabel\":\"Updated Laptop Label\"}"))

                .andExpect(status().isOk())

                .andExpect(jsonPath("$.status").value("COMPLETED"));

    }



    @Test

    void test7_ConflictHandlingWhenAnotherStudentEnrollsIdenticalDeviceHash() throws Exception {

        // Student 1 enrolls specific unique device

        String payload = "{\"userAgent\":\"Mozilla/5.0 (UniqueDeviceForStudent1)\",\"platform\":\"Linux x86_64\",\"screenDimensions\":\"2560x1440x32\",\"timezone\":\"America/New_York\"}";



        mockMvc.perform(post("/api/student/device/enroll")

                        .header("Authorization", studentToken)

                        .contentType(MediaType.APPLICATION_JSON)

                        .content(payload))

                .andExpect(status().isOk());



        // Student 2 attempts to enroll identical device signals payload

        mockMvc.perform(post("/api/student/device/enroll")

                        .header("Authorization", student2Token)

                        .contentType(MediaType.APPLICATION_JSON)

                        .content(payload))

                .andExpect(status().isConflict())

                .andExpect(jsonPath("$.message").value("This device is already registered to another student account."));

    }

}
