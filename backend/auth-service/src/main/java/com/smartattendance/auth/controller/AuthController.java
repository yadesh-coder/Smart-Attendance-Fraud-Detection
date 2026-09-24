package com.smartattendance.auth.controller;

import com.smartattendance.auth.dto.ChangePasswordRequest;
import com.smartattendance.auth.dto.CreateUserRequest;
import com.smartattendance.auth.dto.LoginRequest;
import com.smartattendance.auth.dto.LoginResponse;
import com.smartattendance.auth.dto.UserDto;
import com.smartattendance.auth.entity.Role;
import com.smartattendance.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        String email = (String) authentication.getPrincipal();
        UserDto userDto = authService.getCurrentUser(email);
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Collections.singletonMap("message", "Logged out successfully."));
    }

    @PostMapping("/admin/users")
    public ResponseEntity<UserDto> createUserByAdmin(@RequestBody CreateUserRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        boolean isFaculty = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FACULTY".equals(a.getAuthority()));

        if (!isAdmin && !isFaculty) {
            return ResponseEntity.status(403).build();
        }

        if (isFaculty && !isAdmin) {
            if (request.getRole() != Role.STUDENT) {
                return ResponseEntity.status(403).build();
            }
        }

        UserDto created = authService.createUserByAdmin(request);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        String email = (String) authentication.getPrincipal();
        authService.changePassword(email, request);
        return ResponseEntity.ok(Collections.singletonMap("message", "Password changed successfully."));
    }

    @PutMapping("/users/deactivate")
    public ResponseEntity<Map<String, String>> deactivateUser(@RequestBody Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        String email = body.get("email");
        authService.deactivateUser(email);
        return ResponseEntity.ok(Collections.singletonMap("message", "User account deactivated successfully."));
    }

    @PutMapping("/users/profile")
    public ResponseEntity<Map<String, String>> updateUserProfile(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String name = body.get("name");
        if (email != null && name != null && !email.isBlank() && !name.isBlank()) {
            authService.updateUserProfile(email, name);
        }
        return ResponseEntity.ok(Collections.singletonMap("message", "User profile updated successfully."));
    }

    @DeleteMapping("/admin/users/by-email")
    public ResponseEntity<Map<String, String>> deleteUserByEmail(@RequestParam("email") String email) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        boolean isFaculty = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_FACULTY".equals(a.getAuthority()));

        if (!isAdmin && !isFaculty) {
            return ResponseEntity.status(403).build();
        }

        authService.deleteUserByEmail(email);
        return ResponseEntity.ok(Collections.singletonMap("message", "User account deleted successfully."));
    }
}
