package com.smartattendance.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartattendance.auth.config.JwtTokenProvider;
import com.smartattendance.auth.dto.LoginRequest;
import com.smartattendance.auth.entity.AccountStatus;
import com.smartattendance.auth.entity.Role;
import com.smartattendance.auth.entity.UserEntity;
import com.smartattendance.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private UserEntity activeUser;
    private UserEntity inactiveUser;
    private UserEntity initialPassStudent;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        activeUser = new UserEntity("testadmin@college.edu", "Test Admin", passwordEncoder.encode("secret123"), Role.ADMIN, AccountStatus.ACTIVE, false);
        userRepository.save(activeUser);

        inactiveUser = new UserEntity("inactive@college.edu", "Inactive User", passwordEncoder.encode("secret123"), Role.FACULTY, AccountStatus.INACTIVE, false);
        userRepository.save(inactiveUser);

        initialPassStudent = new UserEntity("newstudent@college.edu", "New Student", passwordEncoder.encode("initialPass123"), Role.STUDENT, AccountStatus.ACTIVE, true);
        userRepository.save(initialPassStudent);
    }

    @Test
    void testSuccessfulLogin() throws Exception {
        LoginRequest request = new LoginRequest("testadmin@college.edu", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("testadmin@college.edu"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.mustChangePassword").value(false))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void testInitialPasswordLoginReturnsMustChangePasswordTrue() throws Exception {
        LoginRequest request = new LoginRequest("newstudent@college.edu", "initialPass123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newstudent@college.edu"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void testAdminCreatesFacultySetsMustChangePasswordTrue() throws Exception {
        String adminToken = tokenProvider.generateToken(activeUser.getId(), activeUser.getEmail(), activeUser.getRole());

        String json = """
                {
                    "email": "createdfaculty@college.edu",
                    "password": "initFacultyPass#123",
                    "name": "Prof Created",
                    "role": "FACULTY"
                }
                """;

        mockMvc.perform(post("/api/auth/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("createdfaculty@college.edu"))
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void testAdminCreatesStudentSetsMustChangePasswordTrue() throws Exception {
        String adminToken = tokenProvider.generateToken(activeUser.getId(), activeUser.getEmail(), activeUser.getRole());

        String json = """
                {
                    "email": "createdstudent@college.edu",
                    "password": "initStudentPass#123",
                    "name": "Student Created",
                    "role": "STUDENT"
                }
                """;

        mockMvc.perform(post("/api/auth/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("createdstudent@college.edu"))
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void testIncorrectPassword() throws Exception {
        LoginRequest request = new LoginRequest("testadmin@college.edu", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void testUnknownEmail() throws Exception {
        LoginRequest request = new LoginRequest("unknown@college.edu", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testInactiveAccountLogin() throws Exception {
        LoginRequest request = new LoginRequest("inactive@college.edu", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetCurrentUserWithValidAuth() throws Exception {
        String token = tokenProvider.generateToken(activeUser.getId(), activeUser.getEmail(), activeUser.getRole());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("testadmin@college.edu"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void testGetCurrentUserWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully."));
    }

    @Test
    void testChangePasswordSuccessSetsMustChangePasswordFalse() throws Exception {
        String token = tokenProvider.generateToken(initialPassStudent.getId(), initialPassStudent.getEmail(), initialPassStudent.getRole());

        String json = """
                {
                    "currentPassword": "initialPass123",
                    "newPassword": "newStudentPass#456"
                }
                """;

        mockMvc.perform(put("/api/auth/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully."));

        // Verify old password fails
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("newstudent@college.edu", "initialPass123"))))
                .andExpect(status().isUnauthorized());

        // Verify new password succeeds and mustChangePassword is false
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("newstudent@college.edu", "newStudentPass#456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword", is(false)));
    }

    @Test
    void testChangePasswordIncorrectCurrentPassword() throws Exception {
        String token = tokenProvider.generateToken(activeUser.getId(), activeUser.getEmail(), activeUser.getRole());

        String json = """
                {
                    "currentPassword": "wrongCurrentPassword",
                    "newPassword": "newSecret456"
                }
                """;

        mockMvc.perform(put("/api/auth/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Incorrect current password."));
    }

    @Test
    void testChangePasswordUnauthenticated() throws Exception {
        String json = """
                {
                    "currentPassword": "secret123",
                    "newPassword": "newSecret456"
                }
                """;

        mockMvc.perform(put("/api/auth/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());
    }
}
