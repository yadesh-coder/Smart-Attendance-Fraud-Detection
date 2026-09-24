package com.smartattendance.faculty.dto;

public class UpdateFacultyRequest {

    private String fullName;
    private String phone;
    private String department;
    private String designation;
    private String status;

    public UpdateFacultyRequest() {}

    public UpdateFacultyRequest(String fullName, String phone, String department, String designation, String status) {
        this.fullName = fullName;
        this.phone = phone;
        this.department = department;
        this.designation = designation;
        this.status = status;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
