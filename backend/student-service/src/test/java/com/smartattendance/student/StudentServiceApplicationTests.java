package com.smartattendance.student;

import com.smartattendance.student.entity.StudentEntity;
import com.smartattendance.student.repository.StudentRepository;
import com.smartattendance.student.service.AuthServiceClient;
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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StudentRepository studentRepository;

    @MockBean
    private AuthServiceClient authServiceClient;

    private String adminToken;
    private String facultyToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        studentRepository.deleteAll();

        adminToken = "Bearer " + generateTestToken("1", "admin@college.edu", "ADMIN");
        facultyToken = "Bearer " + generateTestToken("2", "faculty@college.edu", "FACULTY");
        studentToken = "Bearer " + generateTestToken("3", "student@college.edu", "STUDENT");

        Mockito.when(authServiceClient.createAuthUser(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(200L);
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
    void test1_FacultyCreatesStudentSuccessfully() throws Exception {
        String json = """
                {
                    "email": "alice@college.edu",
                    "password": "initialPass123",
                    "fullName": "Alice Walker",
                    "studentId": "STU1001",
                    "phone": "9876543210",
                    "department": "Computer Science & Engineering",
                    "course": "B.Tech",
                    "year": "1",
                    "section": "A"
                }
                """;

        mockMvc.perform(post("/api/faculty/students")
                .header("Authorization", facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is("alice@college.edu")))
                .andExpect(jsonPath("$.studentId", is("STU1001")))
                .andExpect(jsonPath("$.enrollmentStatus", is("PENDING")));
    }

    @Test
    void test2_StudentCannotCreateStudent() throws Exception {
        String json = """
                {
                    "email": "bob@college.edu",
                    "password": "pass",
                    "fullName": "Bob",
                    "studentId": "STU1002"
                }
                """;

        mockMvc.perform(post("/api/faculty/students")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void test3_AdminCannotCreateStudentThroughFacultyEndpoint() throws Exception {
        String json = """
                {
                    "email": "bob@college.edu",
                    "password": "pass",
                    "fullName": "Bob",
                    "studentId": "STU1002"
                }
                """;

        mockMvc.perform(post("/api/faculty/students")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void test4_UnauthenticatedStudentCreationReturns401() throws Exception {
        mockMvc.perform(post("/api/faculty/students"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test5_DuplicateStudentIdIsRejected() throws Exception {
        StudentEntity existing = new StudentEntity(200L, "STU1005", "Existing", "exist@college.edu", "123", "CS", "BTech", "1", "A");
        studentRepository.save(existing);

        String json = """
                {
                    "email": "new@college.edu",
                    "password": "pass",
                    "fullName": "New Student",
                    "studentId": "STU1005"
                }
                """;

        mockMvc.perform(post("/api/faculty/students")
                .header("Authorization", facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict());
    }

    @Test
    void test6_DuplicateEmailIsRejected() throws Exception {
        StudentEntity existing = new StudentEntity(200L, "STU1006", "Existing", "dup@college.edu", "123", "CS", "BTech", "1", "A");
        studentRepository.save(existing);

        String json = """
                {
                    "email": "dup@college.edu",
                    "password": "pass",
                    "fullName": "New Student",
                    "studentId": "STU1007"
                }
                """;

        mockMvc.perform(post("/api/faculty/students")
                .header("Authorization", facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict());
    }

    @Test
    void test7_StudentRetrievesOwnProfile() throws Exception {
        studentRepository.save(new StudentEntity(3L, "STU1003", "Student User", "student@college.edu", "123", "CS", "BTech", "1", "A"));

        mockMvc.perform(get("/api/student/profile")
                .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("student@college.edu")))
                .andExpect(jsonPath("$.studentId", is("STU1003")));
    }

    @Test
    void test8_FacultyAccessingStudentProfileEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/student/profile")
                .header("Authorization", facultyToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test9_AdminAccessingStudentProfileEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/student/profile")
                .header("Authorization", adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test10_StudentCannotEditPersonalDetails() throws Exception {
        // Attempting any unauthorized PUT endpoint to student profile receives 405 or 403
        mockMvc.perform(put("/api/student/profile")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"hacked@college.edu\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void test11_StudentCanStartEnrollment() throws Exception {
        studentRepository.save(new StudentEntity(3L, "STU1003", "Student User", "student@college.edu", "123", "CS", "BTech", "1", "A"));

        mockMvc.perform(post("/api/student/enrollment/start")
                .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrollmentStatus", is("IN_PROGRESS")));
    }

    @Test
    void test12_StudentCanRetrieveEnrollmentStatus() throws Exception {
        studentRepository.save(new StudentEntity(3L, "STU1003", "Student User", "student@college.edu", "123", "CS", "BTech", "1", "A"));

        mockMvc.perform(get("/api/student/enrollment/status")
                .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrollmentStatus", is("PENDING")))
                .andExpect(jsonPath("$.enrollmentComplete", is(false)));
    }

    @Test
    void test13_EnrollmentCannotBeCompletedPrematurelyWithoutRealAIAndDeviceVerification() throws Exception {
        studentRepository.save(new StudentEntity(3L, "STU1003", "Student User", "student@college.edu", "123", "CS", "BTech", "1", "A"));

        // Attempting to post face step does NOT mark face verification as COMPLETED since AI model is pending integration
        mockMvc.perform(post("/api/student/enrollment/face")
                .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.faceEnrollmentStatus", not("COMPLETED")))
                .andExpect(jsonPath("$.enrollmentComplete", is(false)));

        // Attempting to post device step does NOT mark device verification as COMPLETED since real device signal component is pending integration
        mockMvc.perform(post("/api/student/enrollment/device")
                .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceEnrollmentStatus", not("COMPLETED")))
                .andExpect(jsonPath("$.enrollmentComplete", is(false)));
    }

    @Test
    void test14_FacultyAndAdminCannotAccessStudentOnlyEnrollmentEndpoints() throws Exception {
        mockMvc.perform(get("/api/student/enrollment/status")
                .header("Authorization", facultyToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/student/enrollment/status")
                .header("Authorization", adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test15_NoSensitiveBiometricOrDeviceDataIsReturned() throws Exception {
        studentRepository.save(new StudentEntity(3L, "STU1003", "Student User", "student@college.edu", "123", "CS", "BTech", "1", "A"));

        mockMvc.perform(get("/api/student/enrollment/status")
                .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rawImage").doesNotExist())
                .andExpect(jsonPath("$.templateEmbedding").doesNotExist())
                .andExpect(jsonPath("$.rawMacAddress").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }
}
