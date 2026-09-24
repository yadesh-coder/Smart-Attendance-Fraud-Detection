package com.smartattendance.attendance.service;

import com.smartattendance.attendance.exception.AttendanceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class FacultyServiceClient {

    private final RestTemplate restTemplate;
    private final String gatewayUrl;

    public FacultyServiceClient(@Value("${gateway.service.url:http://localhost:8081}") String gatewayUrl) {
        this.restTemplate = new RestTemplate();
        this.gatewayUrl = gatewayUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getSubjectDetails(String subjectId, String bearerToken) {
        String url = gatewayUrl + "/api/faculty/subjects/by-code/" + subjectId;

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
            throw new AttendanceException("Subject not found or inaccessible.", HttpStatus.NOT_FOUND);
        } catch (AttendanceException ae) {
            throw ae;
        } catch (Exception ex) {
            throw new AttendanceException("Failed to validate subject with Faculty Service: " + ex.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getFacultyProfile(String bearerToken) {
        String url = gatewayUrl + "/api/faculty/profile";

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
            throw new AttendanceException("Faculty profile not found.", HttpStatus.NOT_FOUND);
        } catch (AttendanceException ae) {
            throw ae;
        } catch (Exception ex) {
            throw new AttendanceException("Failed to validate faculty account status: " + ex.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    @SuppressWarnings("unchecked")
    public boolean checkStudentSubjectAssignment(String subjectId, Long studentUserId, String bearerToken) {
        String url = gatewayUrl + "/api/faculty/subjects/by-code/" + subjectId + "/assigned-students/" + studentUserId;

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
                Object assignedObj = response.getBody().get("assigned");
                return Boolean.TRUE.equals(assignedObj) || "true".equalsIgnoreCase(String.valueOf(assignedObj));
            }
            return false;
        } catch (Exception ex) {
            return false;
        }
    }
}
