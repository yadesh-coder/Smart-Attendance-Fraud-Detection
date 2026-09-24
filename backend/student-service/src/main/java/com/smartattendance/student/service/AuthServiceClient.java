package com.smartattendance.student.service;

import com.smartattendance.student.exception.StudentException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class AuthServiceClient {

    private final RestTemplate restTemplate;
    private final String authServiceUrl;

    public AuthServiceClient(@Value("${auth.service.url:http://localhost:8081/api/auth}") String authServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.authServiceUrl = authServiceUrl;
    }

    public Long createAuthUser(String email, String password, String fullName, String bearerToken) {
        String url = authServiceUrl + "/admin/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", password);
        body.put("name", fullName);
        body.put("role", "STUDENT");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object idObj = response.getBody().get("id");
                if (idObj == null) {
                    idObj = response.getBody().get("userId");
                }
                if (idObj != null) {
                    return Long.valueOf(idObj.toString());
                }
            }
            throw new StudentException("Auth Service student account creation failed.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (StudentException se) {
            throw se;
        } catch (Exception ex) {
            throw new StudentException("Failed to communicate with Auth Service: " + ex.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public void deactivateAuthUser(String email, String bearerToken) {
        String url = authServiceUrl + "/users/deactivate";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null && !bearerToken.isBlank()) {
            if (!bearerToken.startsWith("Bearer ")) {
                bearerToken = "Bearer " + bearerToken;
            }
            headers.set("Authorization", bearerToken);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("email", email);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(url, HttpMethod.PUT, request, Map.class);
        } catch (Exception ex) {
            // Ignore if already inactive
        }
    }

    public void deleteAuthUser(String email, String bearerToken) {
        if (email == null || email.isBlank()) return;
        try {
            java.net.URI uri = org.springframework.web.util.UriComponentsBuilder
                    .fromHttpUrl(authServiceUrl + "/admin/users/by-email")
                    .queryParam("email", email)
                    .build()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            if (bearerToken != null && !bearerToken.isBlank()) {
                if (!bearerToken.startsWith("Bearer ")) {
                    bearerToken = "Bearer " + bearerToken;
                }
                headers.set("Authorization", bearerToken);
            }

            HttpEntity<Void> request = new HttpEntity<>(headers);
            restTemplate.exchange(uri, HttpMethod.DELETE, request, Map.class);
        } catch (Exception ex) {
            org.slf4j.LoggerFactory.getLogger(AuthServiceClient.class).error("Failed to delete auth user {}: {}", email, ex.getMessage(), ex);
        }
    }

    public void updateAuthUser(String email, String name, String bearerToken) {
        if (email == null || email.isBlank()) return;
        try {
            String url = authServiceUrl + "/users/profile";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (bearerToken != null && !bearerToken.isBlank()) {
                if (!bearerToken.startsWith("Bearer ")) {
                    bearerToken = "Bearer " + bearerToken;
                }
                headers.set("Authorization", bearerToken);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("email", email);
            body.put("name", name);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.exchange(url, HttpMethod.PUT, request, Map.class);
        } catch (Exception ignored) {}
    }
}
