package com.smartattendance.face;

import com.smartattendance.face.config.JwtTokenProvider;
import com.smartattendance.face.service.StudentServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import javax.imageio.ImageIO;

import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FaceServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @MockBean
    private StudentServiceClient studentServiceClient;

    private String studentToken;
    private String facultyToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        studentToken = "Bearer " + generateTestToken("101", "student.alice@college.edu", "STUDENT");
        facultyToken = "Bearer " + generateTestToken("202", "faculty.bob@college.edu", "FACULTY");
        adminToken = "Bearer " + generateTestToken("303", "admin@college.edu", "ADMIN");

        Mockito.when(studentServiceClient.registerFaceTemplate(anyString(), anyString()))
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
        mockMvc.perform(post("/api/student/face/enroll")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"frame\":\"sample\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test2_FacultyRequestIsRejectedWith403() throws Exception {
        mockMvc.perform(post("/api/student/face/enroll")
                        .header("Authorization", facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"frame\":\"sample\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void test3_AdminRequestIsRejectedWith403() throws Exception {
        mockMvc.perform(post("/api/student/face/enroll")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"frame\":\"sample\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void test4_MissingOrBlankImageIsRejectedWith400() throws Exception {
        mockMvc.perform(post("/api/student/face/enroll")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"frame\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No image frame provided for face enrollment."));
    }

    @Test
    void test5_BlankImageWithoutFaceIsRejectedWith400() throws Exception {
        // Create blank black image without human face features
        BufferedImage img = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.BLACK);
        g.fillRect(0, 0, 100, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        String base64Image = Base64.getEncoder().encodeToString(baos.toByteArray());

        mockMvc.perform(post("/api/student/face/enroll")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"frame\":\"" + base64Image + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No usable human face detected in the provided image."));
    }

    @Test
    void test6_ValidFaceImageSucceedsAndReturnsCompleted() throws Exception {
        // Create image containing face skin tone and contrast features
        BufferedImage img = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(230, 180, 150)); // Skin tone
        g.fillRect(20, 20, 160, 160);
        g.setColor(new Color(30, 30, 30)); // Eyes / Eyebrows
        g.fillRect(50, 60, 30, 15);
        g.fillRect(120, 60, 30, 15);
        g.fillRect(80, 120, 40, 20); // Mouth
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        String base64Image = Base64.getEncoder().encodeToString(baos.toByteArray());

        mockMvc.perform(post("/api/student/face/enroll")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"frame\":\"" + base64Image + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.enrolled").value(true))
                .andExpect(jsonPath("$.rawImage").doesNotExist())
                .andExpect(jsonPath("$.embedding").doesNotExist())
                .andExpect(jsonPath("$.templateReference").doesNotExist());
    }

    @Test
    void test7_MultipartFileUploadSucceeds() throws Exception {
        BufferedImage img = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(230, 180, 150));
        g.fillRect(20, 20, 160, 160);
        g.setColor(new Color(30, 30, 30));
        g.fillRect(50, 60, 30, 15);
        g.fillRect(120, 60, 30, 15);
        g.fillRect(80, 120, 40, 20);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);

        MockMultipartFile file = new MockMultipartFile("file", "face.jpg", "image/jpeg", baos.toByteArray());

        mockMvc.perform(multipart("/api/student/face/enroll")
                        .file(file)
                        .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.enrolled").value(true));
    }
}
