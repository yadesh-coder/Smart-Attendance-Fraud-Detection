package com.smartattendance.student.controller;

import com.smartattendance.student.dto.EnrollmentStatusResponse;
import com.smartattendance.student.dto.StudentResponse;
import com.smartattendance.student.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentProfileController {

    private final StudentService studentService;

    public StudentProfileController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/profile")
    public ResponseEntity<StudentResponse> getProfile() {
        String email = getAuthenticatedEmail();
        StudentResponse profile = studentService.getStudentProfile(email);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/enrollment/start")
    public ResponseEntity<EnrollmentStatusResponse> startEnrollment() {
        String email = getAuthenticatedEmail();
        EnrollmentStatusResponse status = studentService.startEnrollment(email);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/enrollment/status")
    public ResponseEntity<EnrollmentStatusResponse> getEnrollmentStatus() {
        String email = getAuthenticatedEmail();
        EnrollmentStatusResponse status = studentService.getEnrollmentStatus(email);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/enrollment/face")
    public ResponseEntity<EnrollmentStatusResponse> completeFaceStep(@RequestBody(required = false) Map<String, String> body) {
        String email = getAuthenticatedEmail();
        String ref = body != null ? body.get("templateReference") : null;
        EnrollmentStatusResponse status = studentService.completeFaceStep(email, ref);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/enrollment/face/stored-template")
    public ResponseEntity<Map<String, Object>> getStoredFaceTemplate() {
        String email = getAuthenticatedEmail();
        Map<String, Object> response = studentService.getStoredFaceTemplate(email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/enrollment/device")
    public ResponseEntity<EnrollmentStatusResponse> completeDeviceStep(@RequestBody(required = false) Map<String, String> body) {
        String email = getAuthenticatedEmail();
        String label = body != null ? body.get("deviceLabel") : null;
        String hash = body != null ? body.get("deviceFingerprintHash") : null;
        EnrollmentStatusResponse status = studentService.completeDeviceStep(email, label, hash);
        return ResponseEntity.ok(status);
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new com.smartattendance.student.exception.StudentException("Authentication token is missing or invalid.", HttpStatus.UNAUTHORIZED);
        }
        return (String) authentication.getPrincipal();
    }
}
