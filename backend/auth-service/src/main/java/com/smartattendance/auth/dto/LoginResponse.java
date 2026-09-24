package com.smartattendance.auth.dto;

import com.smartattendance.auth.entity.Role;

public class LoginResponse {

    private String userId;
    private String name;
    private String email;
    private Role role;
    private String accessToken;
    private boolean mustChangePassword;

    // Direct user object mapping to support frontend AuthResponse context seamlessly
    private UserDto user;
    private String token;

    public LoginResponse() {}

    public LoginResponse(String userId, String name, String email, Role role, String accessToken, UserDto user) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.accessToken = accessToken;
        this.user = user;
        this.token = accessToken;
        this.mustChangePassword = user != null && user.isMustChangePassword();
    }

    public LoginResponse(String userId, String name, String email, Role role, String accessToken, UserDto user, boolean mustChangePassword) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.accessToken = accessToken;
        this.user = user;
        this.token = accessToken;
        this.mustChangePassword = mustChangePassword;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
        this.token = accessToken;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
        if (user != null) {
            this.mustChangePassword = user.isMustChangePassword();
        }
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
        this.accessToken = token;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }
}
