package com.smartattendance.device.controller;

import com.smartattendance.device.dto.DeviceEnrollmentResponse;
import com.smartattendance.device.dto.DeviceSignalDto;
import com.smartattendance.device.exception.DeviceProcessingException;
import com.smartattendance.device.service.DeviceProcessingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/device")
public class DeviceEnrollmentController {

    private final DeviceProcessingService deviceProcessingService;

    public DeviceEnrollmentController(DeviceProcessingService deviceProcessingService) {
        this.deviceProcessingService = deviceProcessingService;
    }

    @PostMapping("/enroll")
    public ResponseEntity<DeviceEnrollmentResponse> enrollDevice(
            @RequestBody(required = false) DeviceSignalDto dto,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {

        String studentEmail = getAuthenticatedStudentEmail();
        DeviceEnrollmentResponse response = deviceProcessingService.processDeviceEnrollment(dto, studentEmail, bearerToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<java.util.Map<String, Object>> verifyDevice(
            @RequestBody(required = false) DeviceSignalDto dto,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {

        String studentEmail = getAuthenticatedStudentEmail();
        java.util.Map<String, Object> response = deviceProcessingService.verifyDevice(dto, studentEmail, bearerToken);
        return ResponseEntity.ok(response);
    }

    private String getAuthenticatedStudentEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new DeviceProcessingException("Unauthenticated requests are rejected.", HttpStatus.UNAUTHORIZED);
        }
        return auth.getName();
    }
}
