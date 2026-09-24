package com.smartattendance.location.controller;

import com.smartattendance.location.dto.LocationVerificationRequest;
import com.smartattendance.location.dto.LocationVerificationResponse;
import com.smartattendance.location.exception.LocationProcessingException;
import com.smartattendance.location.service.LocationProcessingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student/location")
@PreAuthorize("hasRole('STUDENT')")
public class LocationVerificationController {

    private final LocationProcessingService locationProcessingService;

    public LocationVerificationController(LocationProcessingService locationProcessingService) {
        this.locationProcessingService = locationProcessingService;
    }

    @PostMapping("/verify")
    public ResponseEntity<LocationVerificationResponse> verifyLocation(@RequestBody LocationVerificationRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new LocationProcessingException("Unauthorized: Authentication token is missing.", HttpStatus.UNAUTHORIZED);
        }

        Long studentUserId = getAuthenticatedUserId(auth);
        String studentEmail = auth.getName();
        String bearerToken = getBearerToken(auth);

        LocationVerificationResponse response = locationProcessingService.verifyLocation(request, studentUserId, studentEmail, bearerToken);
        return ResponseEntity.ok(response);
    }

    @SuppressWarnings("unchecked")
    private Long getAuthenticatedUserId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            Object userIdObj = details.get("userId");
            if (userIdObj instanceof Number) {
                return ((Number) userIdObj).longValue();
            } else if (userIdObj instanceof String) {
                return Long.parseLong((String) userIdObj);
            }
        }
        throw new LocationProcessingException("Authenticated student user ID could not be identified.", HttpStatus.UNAUTHORIZED);
    }

    @SuppressWarnings("unchecked")
    private String getBearerToken(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            Object tokenObj = details.get("bearerToken");
            if (tokenObj instanceof String) {
                return (String) tokenObj;
            }
        }
        return "";
    }
}
