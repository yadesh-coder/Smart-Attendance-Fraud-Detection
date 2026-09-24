package com.smartattendance.faculty.dto;

public class CreateFacultyRequest {

    private String email;
    private String password;
    private String fullName;
    private String employeeId;
    private String phone;
    private String department;
    private String designation;

    public CreateFacultyRequest() {}

    public CreateFacultyRequest(String email, String password, String fullName, String employeeId, String phone, String department, String designation) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.employeeId = employeeId;
        this.phone = phone;
        this.department = department;
        this.designation = designation;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }
}
