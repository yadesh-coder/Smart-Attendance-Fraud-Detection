package com.smartattendance.faculty.controller;

import com.smartattendance.faculty.dto.CreateFacultyRequest;
import com.smartattendance.faculty.dto.FacultyResponse;
import com.smartattendance.faculty.dto.UpdateFacultyRequest;
import com.smartattendance.faculty.service.FacultyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/faculty")
public class AdminFacultyController {

    private final FacultyService facultyService;

    public AdminFacultyController(FacultyService facultyService) {
        this.facultyService = facultyService;
    }

    @PostMapping
    public ResponseEntity<FacultyResponse> createFaculty(
            @RequestBody CreateFacultyRequest request,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        FacultyResponse response = facultyService.createFaculty(request, bearerToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<FacultyResponse>> getAllFaculty() {
        List<FacultyResponse> list = facultyService.getAllFaculty();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacultyResponse> getFacultyById(@PathVariable Long id) {
        FacultyResponse faculty = facultyService.getFacultyById(id);
        return ResponseEntity.ok(faculty);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacultyResponse> updateFaculty(@PathVariable Long id, @RequestBody UpdateFacultyRequest request) {
        FacultyResponse updated = facultyService.updateFaculty(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteFaculty(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        facultyService.deleteFaculty(id, bearerToken);
        return ResponseEntity.ok(Collections.singletonMap("message", "Faculty member and associated faculty data successfully removed."));
    }
}
