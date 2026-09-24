package com.smartattendance.location.service;

import com.smartattendance.location.dto.AttendanceSessionDto;
import com.smartattendance.location.exception.LocationProcessingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AttendanceServiceClient {

    private final RestTemplate restTemplate;

    @Value("${gateway.url:http://localhost:8081}")
    private String gatewayUrl;

    public AttendanceServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    public AttendanceSessionDto getAttendanceSession(String sessionId, String bearerToken) {
        try {
            String url = gatewayUrl + "/api/student/attendance/sessions/by-code/" + sessionId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", bearerToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<AttendanceSessionDto> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, AttendanceSessionDto.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new LocationProcessingException("Attendance session not found for sessionId: " + sessionId, HttpStatus.NOT_FOUND);
        } catch (LocationProcessingException ex) {
            throw ex;
        } catch (Exception e) {
            throw new LocationProcessingException("Unable to retrieve attendance session details: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    public boolean updateLocationStatus(String sessionId, Long studentUserId, String locationStatus, String bearerToken) {
        try {
            String url = gatewayUrl + "/api/student/attendance/location-status";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", bearerToken);

            Map<String, Object> body = new HashMap<>();
            body.put("sessionId", sessionId);
            body.put("studentUserId", studentUserId);
            body.put("locationStatus", locationStatus);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.PUT, entity, String.class
            );

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            // Log silently or fallback gracefully
            return false;
        }
    }
}
