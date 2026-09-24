package com.smartattendance.faculty.controller;

import com.smartattendance.faculty.dto.FacultyResponse;
import com.smartattendance.faculty.service.FacultyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faculty")
public class FacultyProfileController {

    private final FacultyService facultyService;

    public FacultyProfileController(FacultyService facultyService) {
        this.facultyService = facultyService;
    }

    @GetMapping("/profile")
    public ResponseEntity<FacultyResponse> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        String email = (String) authentication.getPrincipal();
        FacultyResponse profile = facultyService.getFacultyProfile(email);
        return ResponseEntity.ok(profile);
    }
}
