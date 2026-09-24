package com.smartattendance.student.controller;

import com.smartattendance.student.dto.CreateStudentRequest;
import com.smartattendance.student.dto.StudentResponse;
import com.smartattendance.student.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/students")
public class FacultyStudentController {

    private final StudentService studentService;

    public FacultyStudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    public ResponseEntity<StudentResponse> createStudent(
            @RequestBody CreateStudentRequest request,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        StudentResponse response = studentService.createStudent(request, bearerToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAllStudents() {
        List<StudentResponse> list = studentService.getAllStudents();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable Long id) {
        StudentResponse student = studentService.getStudentById(id);
        return ResponseEntity.ok(student);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long id,
            @RequestBody com.smartattendance.student.dto.UpdateStudentRequest request,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        StudentResponse updated = studentService.updateStudent(id, request, bearerToken);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, String>> deleteStudent(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        studentService.deleteStudent(id, bearerToken);
        return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Student account and enrollment records successfully deleted."));
    }
}
