package com.smartattendance.device.service;

import com.smartattendance.device.exception.DeviceProcessingException;
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

    public StudentServiceClient(@Value("${student.service.url:http://localhost:8081/api/student/enrollment/device}") String studentServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.studentServiceUrl = studentServiceUrl;
    }

    public boolean registerDeviceEnrollment(String deviceFingerprintHash, String deviceLabel, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        Map<String, String> body = new HashMap<>();
        body.put("deviceFingerprintHash", deviceFingerprintHash);
        body.put("deviceLabel", deviceLabel);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(studentServiceUrl, request, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception ex) {
            throw new DeviceProcessingException("Failed to register device enrollment with Student Service: " + ex.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}
