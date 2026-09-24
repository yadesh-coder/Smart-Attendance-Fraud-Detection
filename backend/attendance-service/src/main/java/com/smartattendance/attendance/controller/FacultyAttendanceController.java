package com.smartattendance.attendance.controller;

import com.smartattendance.attendance.config.JwtTokenProvider;
import com.smartattendance.attendance.dto.AttendanceSessionResponse;
import com.smartattendance.attendance.dto.CreateSessionRequest;
import com.smartattendance.attendance.exception.AttendanceException;
import com.smartattendance.attendance.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty/attendance")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyAttendanceController {

    private final AttendanceService attendanceService;
    private final JwtTokenProvider tokenProvider;

    public FacultyAttendanceController(AttendanceService attendanceService, JwtTokenProvider tokenProvider) {
        this.attendanceService = attendanceService;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/sessions")
    public ResponseEntity<AttendanceSessionResponse> createSession(
            @RequestBody CreateSessionRequest request,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        Long facultyUserId = getAuthenticatedUserId();
        AttendanceSessionResponse response = attendanceService.createSession(request, facultyUserId, bearerToken);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<AttendanceSessionResponse>> getSessions() {
        Long facultyUserId = getAuthenticatedUserId();
        List<AttendanceSessionResponse> response = attendanceService.getFacultySessions(facultyUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<AttendanceSessionResponse> getSessionById(@PathVariable String id) {
        Long facultyUserId = getAuthenticatedUserId();
        AttendanceSessionResponse response = attendanceService.getFacultySessionById(id, facultyUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{id}/attendance")
    public ResponseEntity<List<com.smartattendance.attendance.dto.AttendanceRecordResponse>> getSessionAttendance(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        Long facultyUserId = getAuthenticatedUserId();
        List<com.smartattendance.attendance.dto.AttendanceRecordResponse> response = attendanceService.getSessionParticipants(id, facultyUserId, bearerToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{id}/participants")
    public ResponseEntity<List<com.smartattendance.attendance.dto.AttendanceRecordResponse>> getSessionParticipants(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        Long facultyUserId = getAuthenticatedUserId();
        List<com.smartattendance.attendance.dto.AttendanceRecordResponse> response = attendanceService.getSessionParticipants(id, facultyUserId, bearerToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports")
    public ResponseEntity<List<com.smartattendance.attendance.dto.FacultyReportResponse>> getReports(
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        Long facultyUserId = getAuthenticatedUserId();
        List<com.smartattendance.attendance.dto.FacultyReportResponse> response = attendanceService.getFacultyAttendanceReports(facultyUserId, bearerToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sessions/{id}/start")
    public ResponseEntity<AttendanceSessionResponse> startSession(@PathVariable String id) {
        Long facultyUserId = getAuthenticatedUserId();
        AttendanceSessionResponse response = attendanceService.startSession(id, facultyUserId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sessions/{id}/close")
    public ResponseEntity<AttendanceSessionResponse> closeSession(@PathVariable String id) {
        Long facultyUserId = getAuthenticatedUserId();
        AttendanceSessionResponse response = attendanceService.closeSession(id, facultyUserId);
        return ResponseEntity.ok(response);
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
        throw new AttendanceException("Authenticated faculty user ID could not be identified.", HttpStatus.UNAUTHORIZED);
    }
}
