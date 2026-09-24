package com.smartattendance.attendance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class FraudServiceClient {

    private final RestTemplate restTemplate;
    private final String fraudServiceUrl;

    public FraudServiceClient(@Value("${fraud.service.url:http://localhost:8081/api/fraud}") String fraudServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.fraudServiceUrl = fraudServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> evaluateFraud(Map<String, Object> requestPayload, String bearerToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (bearerToken != null && !bearerToken.isBlank()) {
                headers.set("Authorization", bearerToken.startsWith("Bearer ") ? bearerToken : "Bearer " + bearerToken);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    fraudServiceUrl + "/evaluate",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception e) {
            // Log & fallback to pending if fraud service call fails
        }
        return Map.of("decision", "PENDING", "riskLevel", "MEDIUM");
    }
}
