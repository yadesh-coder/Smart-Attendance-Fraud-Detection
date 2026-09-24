package com.smartattendance.faculty.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/departments")
public class PublicDepartmentController {

    private final JdbcTemplate jdbcTemplate;

    public PublicDepartmentController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getDepartments() {
        ensureDepartmentsTableExists();
        List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT id, name, code, created_at AS createdAt FROM departments ORDER BY id ASC");
        return ResponseEntity.ok(list);
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
