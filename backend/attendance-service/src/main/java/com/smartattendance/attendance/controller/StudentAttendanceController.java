package com.smartattendance.attendance.controller;

import com.smartattendance.attendance.dto.AttendanceRecordResponse;
import com.smartattendance.attendance.dto.AttendanceSessionResponse;
import com.smartattendance.attendance.dto.QrValidationResponse;
import com.smartattendance.attendance.dto.VerifyCodeRequest;
import com.smartattendance.attendance.dto.VerifyQrRequest;
import com.smartattendance.attendance.exception.AttendanceException;
import com.smartattendance.attendance.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/attendance")
@PreAuthorize("hasRole('STUDENT')")
public class StudentAttendanceController {

    private final AttendanceService attendanceService;

    public StudentAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/live-sessions")
    public ResponseEntity<List<AttendanceSessionResponse>> getLiveSessions(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        Long studentUserId = getAuthenticatedUserId();
        List<AttendanceSessionResponse> sessions = attendanceService.getStudentLiveSessions(studentUserId, bearerToken);
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/verify-qr")
    public ResponseEntity<QrValidationResponse> verifyQr(@RequestBody VerifyQrRequest request,
                                                          @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        Long studentUserId = getAuthenticatedUserId();
        QrValidationResponse response = attendanceService.verifyQr(request, studentUserId, bearerToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-code")
    public ResponseEntity<QrValidationResponse> verifyCode(@RequestBody VerifyCodeRequest request,
                                                            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        Long studentUserId = getAuthenticatedUserId();
        QrValidationResponse response = attendanceService.verifyCode(request, studentUserId, bearerToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/by-code/{sessionId}")
    public ResponseEntity<AttendanceSessionResponse> getSessionByCode(@PathVariable String sessionId) {
        AttendanceSessionResponse response = attendanceService.getSessionBySessionId(sessionId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/location-status")
    public ResponseEntity<QrValidationResponse> updateLocationStatus(@RequestBody Map<String, Object> body,
                                                                       @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        String sessionId = body != null ? (String) body.get("sessionId") : null;
        if (sessionId == null || sessionId.isBlank()) {
            throw new AttendanceException("Session ID is required.", HttpStatus.BAD_REQUEST);
        }

        Long authenticatedUserId = getAuthenticatedUserId();

        Object studentUserIdObj = body != null ? body.get("studentUserId") : null;
        if (studentUserIdObj != null && !String.valueOf(studentUserIdObj).isBlank() && !"null".equalsIgnoreCase(String.valueOf(studentUserIdObj))) {
            try {
                Long bodyUserId = Long.parseLong(String.valueOf(studentUserIdObj));
                if (!bodyUserId.equals(authenticatedUserId)) {
                    throw new AttendanceException("Access Denied: You are not authorized to modify verification attempts for another student.", HttpStatus.FORBIDDEN);
                }
            } catch (NumberFormatException nfe) {
                throw new AttendanceException("Access Denied: Invalid student ID parameter.", HttpStatus.BAD_REQUEST);
            }
        }

        Long studentUserId = authenticatedUserId;
        String locationStatus = body != null ? (String) body.get("locationStatus") : null;
        String faceStatus = body != null ? (String) body.get("faceStatus") : null;
        String deviceStatus = body != null ? (String) body.get("deviceStatus") : null;
        QrValidationResponse response = attendanceService.updateVerificationAttemptSignals(sessionId, studentUserId, faceStatus, deviceStatus, locationStatus, bearerToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AttendanceRecordResponse>> getHistory() {
        Long studentUserId = getAuthenticatedUserId();
        List<AttendanceRecordResponse> history = attendanceService.getStudentHistory(studentUserId);
        return ResponseEntity.ok(history);
    }

    @SuppressWarnings("unchecked")
    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            Object userIdObj = details.get("userId");
            if (userIdObj instanceof Number) {
                return ((Number) userIdObj).longValue();
            } else if (userIdObj instanceof String) {
                return Long.parseLong((String) userIdObj);
            }
        }
        throw new AttendanceException("Authenticated student user ID could not be identified.", HttpStatus.UNAUTHORIZED);
    }
}
