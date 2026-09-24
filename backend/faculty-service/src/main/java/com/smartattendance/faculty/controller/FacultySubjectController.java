package com.smartattendance.faculty.controller;

import com.smartattendance.faculty.dto.CreateSubjectRequest;
import com.smartattendance.faculty.dto.SubjectResponse;
import com.smartattendance.faculty.entity.FacultyEntity;
import com.smartattendance.faculty.exception.FacultyException;
import com.smartattendance.faculty.repository.FacultyRepository;
import com.smartattendance.faculty.service.SubjectService;
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
@RequestMapping("/api/faculty/subjects")
public class FacultySubjectController {

    private final SubjectService subjectService;
    private final FacultyRepository facultyRepository;

    public FacultySubjectController(SubjectService subjectService, FacultyRepository facultyRepository) {
        this.subjectService = subjectService;
        this.facultyRepository = facultyRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<SubjectResponse> createSubject(@RequestBody CreateSubjectRequest request) {
        Long facultyUserId = getAuthenticatedUserId();
        SubjectResponse response = subjectService.createSubject(request, facultyUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<SubjectResponse>> getFacultySubjects() {
        Long facultyUserId = getAuthenticatedUserId();
        List<SubjectResponse> response = subjectService.getFacultySubjects(facultyUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<SubjectResponse> getSubjectById(@PathVariable Long id) {
        Long facultyUserId = getAuthenticatedUserId();
        SubjectResponse response = subjectService.getSubjectById(id, facultyUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-code/{subjectId}")
    public ResponseEntity<SubjectResponse> getSubjectByCode(@PathVariable String subjectId) {
        SubjectResponse response = subjectService.getSubjectBySubjectId(subjectId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<SubjectResponse> updateSubject(@PathVariable Long id, @RequestBody CreateSubjectRequest request) {
        Long facultyUserId = getAuthenticatedUserId();
        SubjectResponse response = subjectService.updateSubject(id, request, facultyUserId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Map<String, String>> deleteSubject(@PathVariable String id) {
        Long facultyUserId = getAuthenticatedUserId();
        subjectService.deleteSubject(id, facultyUserId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Subject successfully deactivated."));
    }

    @PostMapping("/{subjectId}/students")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<Long>> assignStudentsToSubject(@PathVariable String subjectId, @RequestBody Map<String, List<Long>> body) {
        Long facultyUserId = getAuthenticatedUserId();
        List<Long> studentUserIds = body != null ? body.get("studentUserIds") : null;
        List<Long> assigned = subjectService.assignStudentsToSubject(subjectId, studentUserIds, facultyUserId);
        return ResponseEntity.ok(assigned);
    }

    @DeleteMapping("/{subjectId}/students/{studentUserId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Map<String, String>> removeStudentFromSubject(@PathVariable String subjectId, @PathVariable Long studentUserId) {
        Long facultyUserId = getAuthenticatedUserId();
        subjectService.removeStudentFromSubject(subjectId, studentUserId, facultyUserId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Student assignment removed successfully."));
    }

    @GetMapping("/{subjectId}/students")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<List<Long>> getAssignedStudentUserIds(@PathVariable String subjectId) {
        List<Long> assigned = subjectService.getAssignedStudentUserIds(subjectId);
        return ResponseEntity.ok(assigned);
    }

    @GetMapping("/by-code/{subjectId}/assigned-students/{studentUserId}")
    public ResponseEntity<Map<String, Boolean>> checkStudentAssignment(@PathVariable String subjectId, @PathVariable Long studentUserId) {
        boolean isAssigned = subjectService.isStudentAssignedToSubject(subjectId, studentUserId);
        return ResponseEntity.ok(Collections.singletonMap("assigned", isAssigned));
    }

    @SuppressWarnings("unchecked")
    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            Object userIdObj = details.get("userId");
            if (userIdObj instanceof Number) {
                return ((Number) userIdObj).longValue();
            } else if (userIdObj instanceof String && !((String) userIdObj).isBlank()) {
                return Long.parseLong((String) userIdObj);
            }
        }
        if (auth != null && auth.getPrincipal() instanceof String) {
            String email = (String) auth.getPrincipal();
            FacultyEntity faculty = facultyRepository.findByEmailIgnoreCase(email).orElse(null);
            if (faculty != null && faculty.getUserId() != null) {
                return faculty.getUserId();
            }
        }
        throw new FacultyException("Authenticated faculty user ID could not be identified.", HttpStatus.UNAUTHORIZED);
    }
}
