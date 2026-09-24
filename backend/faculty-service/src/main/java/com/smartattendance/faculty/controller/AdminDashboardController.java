package com.smartattendance.faculty.controller;

import com.smartattendance.faculty.repository.FacultyRepository;
import com.smartattendance.faculty.repository.SubjectRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final FacultyRepository facultyRepository;
    private final SubjectRepository subjectRepository;
    private final JdbcTemplate jdbcTemplate;

    private static Map<String, Object> systemSettings = new HashMap<>();

    static {
        systemSettings.put("geoFencingRadiusMeters", 50);
        systemSettings.put("faceRecognitionThreshold", 85);
        systemSettings.put("qrCodeValiditySeconds", 30);
        systemSettings.put("requireDeviceVerification", true);
        systemSettings.put("allowProxyAppeal", true);
        systemSettings.put("notifyOnCriticalFraud", true);
    }

    public AdminDashboardController(FacultyRepository facultyRepository, SubjectRepository subjectRepository, JdbcTemplate jdbcTemplate) {
        this.facultyRepository = facultyRepository;
        this.subjectRepository = subjectRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        long facultyCount = facultyRepository.count();
        long subjectCount = subjectRepository.count();
        long studentCount = 0;
        long fraudCount = 0;

        try {
            Long sCnt = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM attendance_student_db.students", Long.class);
            if (sCnt != null) studentCount = sCnt;
        } catch (Exception e) {
            // Ignore if schema not accessible
        }

        try {
            Long fCnt = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM attendance_fraud_db.fraud_assessments WHERE decision IN ('SUSPICIOUS', 'REJECTED')", Long.class);
            if (fCnt != null) fraudCount = fCnt;
        } catch (Exception e) {
            // Ignore if schema not accessible
        }

        Map<String, Object> res = new HashMap<>();
        res.put("totalFaculty", facultyCount);
        res.put("totalStudents", studentCount);
        res.put("totalSubjects", subjectCount);
        res.put("fraudAlertsCount", fraudCount);

        return ResponseEntity.ok(res);
    }

    @GetMapping("/activities")
    public ResponseEntity<List<Map<String, Object>>> getActivities() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/fraud")
    public ResponseEntity<List<Map<String, Object>>> getFraudAlerts() {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            list = jdbcTemplate.queryForList("SELECT id, attempt_id AS attemptId, student_user_id AS studentUserId, decision, risk_score AS riskScore, evaluated_at AS timestamp FROM attendance_fraud_db.fraud_assessments WHERE decision IN ('SUSPICIOUS', 'REJECTED') ORDER BY id DESC LIMIT 50");
        } catch (Exception e) {
            // Return empty list if database query unavailable
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getStudents() {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            list = jdbcTemplate.queryForList("SELECT id, user_id AS userId, student_id AS studentId, student_id AS rollNumber, full_name AS name, full_name AS fullName, email, department, course, academic_year AS semester, section, status, enrollment_status AS enrollmentStatus FROM attendance_student_db.students ORDER BY id DESC");
        } catch (Exception e) {
            // Return empty list if database query unavailable
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Map<String, Object>>> getSubjects() {
        List<Map<String, Object>> list = new ArrayList<>();
        subjectRepository.findAll().forEach(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", String.valueOf(s.getId()));
            m.put("code", s.getSubjectCode());
            m.put("name", s.getSubjectName());
            m.put("department", s.getDepartment());
            m.put("facultyUserId", s.getFacultyUserId());
            list.add(m);
        });
        return ResponseEntity.ok(list);
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(systemSettings);
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> body) {
        if (body != null) {
            systemSettings.putAll(body);
        }
        return ResponseEntity.ok(systemSettings);
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", "1");
        profile.put("name", "System Administrator");
        profile.put("email", "admin@college.edu");
        profile.put("role", "ADMIN");
        profile.put("accountStatus", "ACTIVE");
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, Object> body) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", "1");
        profile.put("name", body != null && body.containsKey("name") ? body.get("name") : "System Administrator");
        profile.put("email", "admin@college.edu");
        profile.put("role", "ADMIN");
        profile.put("accountStatus", "ACTIVE");
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> getDepartments() {
        ensureDepartmentsTableExists();
        List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT id, name, code, created_at AS createdAt FROM departments ORDER BY id ASC");
        return ResponseEntity.ok(list);
    }

    @PostMapping("/departments")
    public ResponseEntity<Map<String, Object>> createDepartment(@RequestBody Map<String, String> body) {
        ensureDepartmentsTableExists();
        String name = body != null ? body.get("name") : null;
        String code = body != null ? body.get("code") : null;
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Department name is required."));
        }
        name = name.trim();
        code = code != null ? code.trim().toUpperCase() : name.substring(0, Math.min(4, name.length())).toUpperCase();

        try {
            jdbcTemplate.update("INSERT INTO departments (name, code) VALUES (?, ?)", name, code);
            Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            Map<String, Object> res = new HashMap<>();
            res.put("id", id);
            res.put("name", name);
            res.put("code", code);
            return ResponseEntity.status(201).body(res);
        } catch (Exception ex) {
            return ResponseEntity.status(409).body(Collections.singletonMap("message", "A department with this name or code already exists."));
        }
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable Long id) {
        ensureDepartmentsTableExists();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT name FROM departments WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Department not found."));
        }
        String deptName = String.valueOf(rows.get(0).get("name"));

        long facCount = 0, subCount = 0, stuCount = 0;
        try {
            Long c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM faculty WHERE LOWER(department) = LOWER(?)", Long.class, deptName);
            if (c != null) facCount = c;
        } catch (Exception ignored) {}

        try {
            Long c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM subjects WHERE LOWER(department) = LOWER(?)", Long.class, deptName);
            if (c != null) subCount = c;
        } catch (Exception ignored) {}

        try {
            Long c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM attendance_student_db.students WHERE LOWER(department) = LOWER(?)", Long.class, deptName);
            if (c != null) stuCount = c;
        } catch (Exception ignored) {}

        if (facCount > 0 || subCount > 0 || stuCount > 0) {
            return ResponseEntity.status(409).body(Collections.singletonMap("message",
                    String.format("Department cannot be removed because it is still referenced by existing records (%d faculty, %d subjects, %d students).", facCount, subCount, stuCount)));
        }

        jdbcTemplate.update("DELETE FROM departments WHERE id = ?", id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Department successfully removed."));
    }

    private void ensureDepartmentsTableExists() {
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS departments (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "name VARCHAR(150) NOT NULL UNIQUE, " +
                    "code VARCHAR(50) NOT NULL UNIQUE, " +
                    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM departments", Long.class);
            if (count != null && count == 0) {
                jdbcTemplate.execute("INSERT INTO departments (name, code) VALUES " +
                        "('Computer Science & Engineering', 'CSE'), " +
                        "('Information Technology', 'IT'), " +
                        "('Electrical & Electronics', 'EEE'), " +
                        "('Electronics & Communication', 'ECE'), " +
                        "('Mechanical Engineering', 'ME')");
            }
        } catch (Exception ignored) {}
    }
}
