package com.smartattendance.fraud.controller;

import com.smartattendance.fraud.dto.EvaluateFraudRequest;
import com.smartattendance.fraud.dto.FraudAssessmentResponse;
import com.smartattendance.fraud.exception.FraudException;
import com.smartattendance.fraud.service.FraudAssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fraud")
public class FraudAssessmentController {

    private final FraudAssessmentService assessmentService;

    public FraudAssessmentController(FraudAssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<FraudAssessmentResponse> evaluateFraud(@RequestBody EvaluateFraudRequest request) {
        // Authenticated users or internal calls can evaluate fraud
        FraudAssessmentResponse response = assessmentService.evaluateFraud(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assessments/attempt/{attemptId}")
    public ResponseEntity<FraudAssessmentResponse> getAssessmentByAttemptId(@PathVariable String attemptId) {
        FraudAssessmentResponse response = assessmentService.getAssessmentByAttemptId(attemptId);
        validateStudentAccess(response.getStudentUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assessments/student/{studentUserId}")
    public ResponseEntity<List<FraudAssessmentResponse>> getAssessmentsByStudentUserId(@PathVariable Long studentUserId) {
        validateStudentAccess(studentUserId);
        List<FraudAssessmentResponse> response = assessmentService.getAssessmentsByStudentUserId(studentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assessments/session/{sessionId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<List<FraudAssessmentResponse>> getAssessmentsBySessionId(@PathVariable String sessionId) {
        List<FraudAssessmentResponse> response = assessmentService.getAssessmentsBySessionId(sessionId);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(FraudException.class)
    public ResponseEntity<Map<String, Object>> handleFraudException(FraudException ex) {
        Map<String, Object> body = Map.of(
                "status", ex.getStatus().value(),
                "message", ex.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
        );
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @SuppressWarnings("unchecked")
    private void validateStudentAccess(Long targetStudentUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new FraudException("Unauthenticated access.", HttpStatus.UNAUTHORIZED);
        }

        String role = "";
        Long currentUserId = null;

        if (auth.getDetails() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            role = String.valueOf(details.getOrDefault("role", ""));
            Object uId = details.get("userId");
            if (uId instanceof Number) {
                currentUserId = ((Number) uId).longValue();
            } else if (uId instanceof String && !((String) uId).isBlank()) {
                try {
                    currentUserId = Long.parseLong((String) uId);
                } catch (NumberFormatException ignored) {}
            }
        }

        if ("ADMIN".equalsIgnoreCase(role) || "FACULTY".equalsIgnoreCase(role)) {
            return; // Access allowed for Faculty/Admin
        }

        if ("STUDENT".equalsIgnoreCase(role)) {
            if (currentUserId != null && currentUserId.equals(targetStudentUserId)) {
                return; // Access allowed for the student themselves
            }
            throw new FraudException("Access denied: Students can only access their own fraud assessments.", HttpStatus.FORBIDDEN);
        }

        throw new FraudException("Access denied.", HttpStatus.FORBIDDEN);
    }
}
