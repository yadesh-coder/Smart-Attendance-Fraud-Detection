package com.smartattendance.attendance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class StudentServiceClient {

    private final RestTemplate restTemplate;
    private final String gatewayUrl;

    public StudentServiceClient(@Value("${gateway.service.url:http://localhost:8081}") String gatewayUrl) {
        this.restTemplate = new RestTemplate();
        this.gatewayUrl = gatewayUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getStudentProfile(String bearerToken) {
        String url = gatewayUrl + "/api/student/profile";

        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getStudentById(Long studentUserId, String bearerToken) {
        String url = gatewayUrl + "/api/faculty/students/" + studentUserId;

        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public java.util.List<Map<String, Object>> getAllStudents(String bearerToken) {
        String url = gatewayUrl + "/api/faculty/students";

        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<java.util.List> response = restTemplate.exchange(url, HttpMethod.GET, request, java.util.List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (java.util.List<Map<String, Object>>) response.getBody();
            }
            return java.util.Collections.emptyList();
        } catch (Exception ex) {
            return java.util.Collections.emptyList();
        }
    }
}
