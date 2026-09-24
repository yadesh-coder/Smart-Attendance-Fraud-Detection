package com.smartattendance.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartattendance.auth.entity.Role;

public class UserDto {

    private String id;
    private String email;
    private String name;
    private Role role;
    private String department;
    private boolean isFirstTimeSetupComplete;
    private boolean mustChangePassword;

    public UserDto() {}

    public UserDto(String id, String email, String name, Role role, String department, boolean isFirstTimeSetupComplete) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.department = department;
        this.isFirstTimeSetupComplete = isFirstTimeSetupComplete;
        this.mustChangePassword = false;
    }

    public UserDto(String id, String email, String name, Role role, String department, boolean isFirstTimeSetupComplete, boolean mustChangePassword) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.department = department;
        this.isFirstTimeSetupComplete = isFirstTimeSetupComplete;
        this.mustChangePassword = mustChangePassword;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    @JsonProperty("isFirstTimeSetupComplete")
    public boolean isFirstTimeSetupComplete() {
        return isFirstTimeSetupComplete;
    }

    public void setFirstTimeSetupComplete(boolean firstTimeSetupComplete) {
        isFirstTimeSetupComplete = firstTimeSetupComplete;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }
}
