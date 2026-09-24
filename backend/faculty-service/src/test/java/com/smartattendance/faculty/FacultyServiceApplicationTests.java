package com.smartattendance.faculty;

import com.smartattendance.faculty.config.JwtTokenProvider;
import com.smartattendance.faculty.entity.FacultyEntity;
import com.smartattendance.faculty.entity.SubjectEntity;
import com.smartattendance.faculty.repository.FacultyRepository;
import com.smartattendance.faculty.repository.SubjectRepository;
import com.smartattendance.faculty.service.AuthServiceClient;
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
class FacultyServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @MockBean
    private AuthServiceClient authServiceClient;

    private String adminToken;
    private String facultyToken;
    private String faculty2Token;
    private String studentToken;

    @BeforeEach
    void setUp() {
        subjectRepository.deleteAll();
        facultyRepository.deleteAll();

        adminToken = "Bearer " + generateTestToken("1", "admin@college.edu", "ADMIN");
        facultyToken = "Bearer " + generateTestToken("2", "faculty@college.edu", "FACULTY");
        faculty2Token = "Bearer " + generateTestToken("4", "faculty2@college.edu", "FACULTY");
        studentToken = "Bearer " + generateTestToken("3", "student@college.edu", "STUDENT");

        Mockito.when(authServiceClient.createAuthUser(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(100L);

        // Seed Active Faculty 2
        facultyRepository.save(new FacultyEntity(2L, "EMP002", "Faculty One", "faculty@college.edu", "123456", "CSE", "Prof", "ACTIVE"));
        // Seed Active Faculty 4
        facultyRepository.save(new FacultyEntity(4L, "EMP004", "Faculty Two", "faculty2@college.edu", "123456", "CSE", "Prof", "ACTIVE"));
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
    void test1_AdminCreatesFacultySuccessfully() throws Exception {
        String json = """
                {
                    "email": "dr.smith@college.edu",
                    "password": "initialPassword123",
                    "fullName": "Dr. John Smith",
                    "employeeId": "EMP001",
                    "phone": "9876543210",
                    "department": "Computer Science",
                    "designation": "Associate Professor"
                }
                """;

        mockMvc.perform(post("/api/admin/faculty")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is("dr.smith@college.edu")))
                .andExpect(jsonPath("$.employeeId", is("EMP001")))
                .andExpect(jsonPath("$.fullName", is("Dr. John Smith")))
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    void test2_FacultyAttemptingToCreateFacultyReceives403() throws Exception {
        String json = """
                {
                    "email": "dr.jones@college.edu",
                    "password": "password123",
                    "fullName": "Dr. Jones",
                    "employeeId": "EMP002"
                }
                """;

        mockMvc.perform(post("/api/admin/faculty")
                .header("Authorization", facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void test3_StudentAttemptingToCreateFacultyReceives403() throws Exception {
        String json = """
                {
                    "email": "dr.jones@college.edu",
                    "password": "password123",
                    "fullName": "Dr. Jones",
                    "employeeId": "EMP002"
                }
                """;

        mockMvc.perform(post("/api/admin/faculty")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void test4_UnauthenticatedRequestReceives401() throws Exception {
        mockMvc.perform(get("/api/admin/faculty"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test5_FacultyCreatesSubjectSuccessfully() throws Exception {
        String json = """
                {
                    "subjectCode": "CS101",
                    "subjectName": "Computer Programming",
                    "department": "Computer Science",
                    "course": "B.Tech",
                    "academicYear": "2025-2026",
                    "semester": "1",
                    "section": "A"
                }
                """;

        mockMvc.perform(post("/api/faculty/subjects")
                .header("Authorization", facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subjectCode", is("CS101")))
                .andExpect(jsonPath("$.subjectName", is("Computer Programming")))
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    void test6_FacultyListsOwnSubjects() throws Exception {
        subjectRepository.save(new SubjectEntity("SUBJ_001", "CS101", "Programming", "CSE", "B.Tech", "2025", "1", "A", 2L));

        mockMvc.perform(get("/api/faculty/subjects")
                .header("Authorization", facultyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].subjectCode", is("CS101")));
    }

    @Test
    void test7_FacultyEditsOwnSubject() throws Exception {
        SubjectEntity saved = subjectRepository.save(new SubjectEntity("SUBJ_002", "CS102", "Data Structures", "CSE", "B.Tech", "2025", "2", "A", 2L));

        String json = """
                {
                    "subjectName": "Advanced Data Structures"
                }
                """;

        mockMvc.perform(put("/api/faculty/subjects/" + saved.getId())
                .header("Authorization", facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectName", is("Advanced Data Structures")));
    }

    @Test
    void test8_FacultyDeactivatesOwnSubject() throws Exception {
        SubjectEntity saved = subjectRepository.save(new SubjectEntity("SUBJ_003", "CS103", "Algorithms", "CSE", "B.Tech", "2025", "3", "A", 2L));

        mockMvc.perform(delete("/api/faculty/subjects/" + saved.getId())
                .header("Authorization", facultyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("deactivated")));

        SubjectEntity reloaded = subjectRepository.findById(saved.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("INACTIVE", reloaded.getStatus());
    }

    @Test
    void test9_FacultyAccessingAnotherFacultySubjectReturns403() throws Exception {
        SubjectEntity saved = subjectRepository.save(new SubjectEntity("SUBJ_004", "CS104", "Networks", "CSE", "B.Tech", "2025", "4", "A", 4L));

        mockMvc.perform(get("/api/faculty/subjects/" + saved.getId())
                .header("Authorization", facultyToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void test10_StudentCreateSubjectReturns403() throws Exception {
        String json = """
                {
                    "subjectCode": "CS105",
                    "subjectName": "OS"
                }
                """;

        mockMvc.perform(post("/api/faculty/subjects")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void test11_AdminCreateSubjectReturns403() throws Exception {
        String json = """
                {
                    "subjectCode": "CS106",
                    "subjectName": "DB"
                }
                """;

        mockMvc.perform(post("/api/faculty/subjects")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    void test12_UnauthenticatedCreateSubjectReturns401() throws Exception {
        mockMvc.perform(post("/api/faculty/subjects"))
                .andExpect(status().isUnauthorized());
    }
}
