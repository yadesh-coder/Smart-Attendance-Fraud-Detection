package com.smartattendance.student.dto;

import java.time.LocalDateTime;

public class StudentResponse {

    private Long id;
    private Long userId;
    private String studentId;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String course;
    private String year;
    private String semester;
    private String section;
    private String status;
    private String enrollmentStatus;
    private String faceEnrollmentStatus = "PENDING";
    private String deviceEnrollmentStatus = "PENDING";
    private Boolean faceRegistered = false;
    private Boolean deviceRegistered = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public StudentResponse() {}

    public StudentResponse(Long id, Long userId, String studentId, String fullName, String email, String phone, String department, String course, String year, String section, String status, String enrollmentStatus, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.studentId = studentId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.department = department;
        this.course = course;
        this.year = year;
        this.section = section;
        this.status = status;
        this.enrollmentStatus = enrollmentStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public StudentResponse(Long id, Long userId, String studentId, String fullName, String email, String phone, String department, String course, String year, String section, String status, String enrollmentStatus, String faceEnrollmentStatus, String deviceEnrollmentStatus, Boolean faceRegistered, Boolean deviceRegistered, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.studentId = studentId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.department = department;
        this.course = course;
        this.year = year;
        this.section = section;
        this.status = status;
        this.enrollmentStatus = enrollmentStatus;
        this.faceEnrollmentStatus = faceEnrollmentStatus;
        this.deviceEnrollmentStatus = deviceEnrollmentStatus;
        this.faceRegistered = faceRegistered;
        this.deviceRegistered = deviceRegistered;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
        if (this.semester == null) {
            this.semester = year;
        }
    }

    public String getSemester() {
        return semester != null ? semester : year;
    }

    public void setSemester(String semester) {
        this.semester = semester;
        if (this.year == null) {
            this.year = semester;
        }
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getEnrollmentStatus() {
        return enrollmentStatus;
    }

    public void setEnrollmentStatus(String enrollmentStatus) {
        this.enrollmentStatus = enrollmentStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getFaceEnrollmentStatus() {
        return faceEnrollmentStatus;
    }

    public void setFaceEnrollmentStatus(String faceEnrollmentStatus) {
        this.faceEnrollmentStatus = faceEnrollmentStatus;
    }

    public String getDeviceEnrollmentStatus() {
        return deviceEnrollmentStatus;
    }

    public void setDeviceEnrollmentStatus(String deviceEnrollmentStatus) {
        this.deviceEnrollmentStatus = deviceEnrollmentStatus;
    }

    public Boolean getFaceRegistered() {
        return faceRegistered;
    }

    public void setFaceRegistered(Boolean faceRegistered) {
        this.faceRegistered = faceRegistered;
    }

    public Boolean getDeviceRegistered() {
        return deviceRegistered;
    }

    public void setDeviceRegistered(Boolean deviceRegistered) {
        this.deviceRegistered = deviceRegistered;
    }
}
