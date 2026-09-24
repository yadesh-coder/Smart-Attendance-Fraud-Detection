package com.smartattendance.face.service;

import com.smartattendance.face.exception.FaceProcessingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class StudentServiceClient {

    private final RestTemplate restTemplate;
    private final String studentServiceUrl;

    public StudentServiceClient(@Value("${student.service.url:http://localhost:8081/api/student/enrollment/face}") String studentServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.studentServiceUrl = studentServiceUrl;
    }

    public boolean registerFaceTemplate(String templateReference, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        Map<String, String> body = new HashMap<>();
        body.put("templateReference", templateReference);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(studentServiceUrl, request, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception ex) {
            throw new FaceProcessingException("Failed to register face template with Student Service: " + ex.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Map<String, Object> getStoredFaceTemplate(String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            String baseUrl = studentServiceUrl;
            if (baseUrl.endsWith("/face")) {
                baseUrl = baseUrl + "/stored-template";
            } else {
                baseUrl = baseUrl + "/face/stored-template";
            }
            ResponseEntity<Map> response = restTemplate.exchange(baseUrl, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception ex) {
            // Return missing enrollment map on network/service failure
        }
        return Map.of("enrolled", false, "status", "FACE_ENROLLMENT_REQUIRED");
    }
}
