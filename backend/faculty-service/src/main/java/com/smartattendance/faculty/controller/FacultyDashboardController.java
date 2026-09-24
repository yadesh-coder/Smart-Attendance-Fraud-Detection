package com.smartattendance.faculty.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/faculty")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyDashboardController {

    private final JdbcTemplate jdbcTemplate;

    public FacultyDashboardController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        String email = getAuthenticatedUserEmail();
        long totalClasses = 0;
        long totalProxies = 0;
        long verifiedAttendanceCount = 0;
        long failedVerificationCount = 0;
        long totalRecords = 0;
        double avgAttendanceRate = 0.0;

        try {
            Long cCnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM attendance_db.attendance_sessions s " +
                "JOIN attendance_faculty_db.faculty f ON s.faculty_user_id = f.user_id " +
                "WHERE LOWER(f.email) = LOWER(?)", Long.class, email);
            if (cCnt != null) totalClasses = cCnt;
        } catch (Exception e) {
            // Ignore if schema unreachable
        }

        try {
            Long pCnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM attendance_fraud_db.fraud_assessments " +
                "WHERE decision IN ('SUSPICIOUS', 'REJECTED')", Long.class);
            if (pCnt != null) totalProxies = pCnt;
        } catch (Exception e) {
            // Ignore if schema unreachable
        }

        try {
            Long vCnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM attendance_db.attendance_records r " +
                "JOIN attendance_db.attendance_sessions s ON r.session_id = s.session_id " +
                "JOIN attendance_faculty_db.faculty f ON s.faculty_user_id = f.user_id " +
                "WHERE LOWER(f.email) = LOWER(?) AND r.attendance_status = 'PRESENT'", Long.class, email);
            if (vCnt != null) verifiedAttendanceCount = vCnt;
        } catch (Exception e) {
            // Ignore if schema unreachable
        }

        try {
            Long fCnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM attendance_db.attendance_records r " +
                "JOIN attendance_db.attendance_sessions s ON r.session_id = s.session_id " +
                "JOIN attendance_faculty_db.faculty f ON s.faculty_user_id = f.user_id " +
                "WHERE LOWER(f.email) = LOWER(?) AND r.attendance_status IN ('REJECTED', 'FAILED')", Long.class, email);
            if (fCnt != null) failedVerificationCount = fCnt;
        } catch (Exception e) {
            // Ignore if schema unreachable
        }

        try {
            Long tCnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM attendance_db.attendance_records r " +
                "JOIN attendance_db.attendance_sessions s ON r.session_id = s.session_id " +
                "JOIN attendance_faculty_db.faculty f ON s.faculty_user_id = f.user_id " +
                "WHERE LOWER(f.email) = LOWER(?)", Long.class, email);
            if (tCnt != null) totalRecords = tCnt;
        } catch (Exception e) {
            // Ignore if schema unreachable
        }

        if (totalRecords > 0) {
            avgAttendanceRate = Math.round((verifiedAttendanceCount * 100.0 / totalRecords) * 10.0) / 10.0;
        } else {
            avgAttendanceRate = 0.0;
        }

        Map<String, Object> res = new HashMap<>();
        res.put("averageAttendanceRate", avgAttendanceRate);
        res.put("totalClassesConducted", totalClasses);
        res.put("totalFlaggedProxies", totalProxies);
        res.put("verifiedAttendanceCount", verifiedAttendanceCount);
        res.put("suspiciousAttemptsCount", totalProxies);
        res.put("failedVerificationCount", failedVerificationCount);

        return ResponseEntity.ok(res);
    }

    @GetMapping("/fraud-alerts")
    public ResponseEntity<List<Map<String, Object>>> getFraudAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        try {
            alerts = jdbcTemplate.queryForList(
                "SELECT id, attempt_id AS attemptId, student_user_id AS studentUserId, " +
                "decision, risk_score AS riskScore, evaluated_at AS timestamp " +
                "FROM attendance_fraud_db.fraud_assessments WHERE decision IN ('SUSPICIOUS', 'REJECTED') " +
                "ORDER BY id DESC LIMIT 20"
            );
        } catch (Exception e) {
            // Return empty list if query unavailable
        }
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/fraud-alerts/{id}")
    public ResponseEntity<Map<String, Object>> getFraudAlertById(@PathVariable String id) {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT id, attempt_id AS attemptId, student_user_id AS studentUserId, " +
                "decision, risk_score AS riskScore, evaluated_at AS timestamp " +
                "FROM attendance_fraud_db.fraud_assessments WHERE id = ?", id
            );
            if (!list.isEmpty()) {
                return ResponseEntity.ok(list.get(0));
            }
        } catch (Exception e) {
            // Fallthrough
        }
        return ResponseEntity.notFound().build();
    }

    private String getAuthenticatedUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "";
        }
        return auth.getName();
    }
}
