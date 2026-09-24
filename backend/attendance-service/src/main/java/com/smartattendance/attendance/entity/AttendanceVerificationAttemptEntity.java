package com.smartattendance.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_verification_attempts")
public class AttendanceVerificationAttemptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_id", nullable = false, unique = true, length = 100)
    private String attemptId;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "student_user_id", nullable = false)
    private Long studentUserId;

    @Column(name = "qr_status", nullable = true, length = 50)
    private String qrStatus = "QR_VALID"; // QR_VALID, INVALID

    @Column(name = "face_status", nullable = true, length = 50)
    private String faceStatus = "NOT_AVAILABLE"; // NOT_AVAILABLE

    @Column(name = "location_status", nullable = true, length = 50)
    private String locationStatus = "NOT_AVAILABLE"; // NOT_AVAILABLE

    @Column(name = "device_status", nullable = true, length = 50)
    private String deviceStatus = "NOT_AVAILABLE"; // NOT_AVAILABLE

    @Column(name = "overall_status", nullable = true, length = 50)
    private String overallStatus = "PENDING"; // PENDING, PROCESSING

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public AttendanceVerificationAttemptEntity() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public AttendanceVerificationAttemptEntity(String attemptId, String sessionId, Long studentUserId) {
        this.attemptId = attemptId;
        this.sessionId = sessionId;
        this.studentUserId = studentUserId;
        this.qrStatus = "QR_VALID";
        this.faceStatus = "NOT_AVAILABLE";
        this.locationStatus = "NOT_AVAILABLE";
        this.deviceStatus = "NOT_AVAILABLE";
        this.overallStatus = "PENDING";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    public void ensureDefaults() {
        if (this.qrStatus == null) this.qrStatus = "NOT_AVAILABLE";
        if (this.faceStatus == null) this.faceStatus = "NOT_AVAILABLE";
        if (this.locationStatus == null) this.locationStatus = "NOT_AVAILABLE";
        if (this.deviceStatus == null) this.deviceStatus = "NOT_AVAILABLE";
        if (this.overallStatus == null) this.overallStatus = "PENDING";
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(String attemptId) {
        this.attemptId = attemptId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Long getStudentUserId() {
        return studentUserId;
    }

    public void setStudentUserId(Long studentUserId) {
        this.studentUserId = studentUserId;
    }

    public String getQrStatus() {
        return qrStatus;
    }

    public void setQrStatus(String qrStatus) {
        this.qrStatus = qrStatus;
    }

    public String getFaceStatus() {
        return faceStatus;
    }

    public void setFaceStatus(String faceStatus) {
        this.faceStatus = faceStatus;
    }

    public String getLocationStatus() {
        return locationStatus;
    }

    public void setLocationStatus(String locationStatus) {
        this.locationStatus = locationStatus;
    }

    public String getDeviceStatus() {
        return deviceStatus;
    }

    public void setDeviceStatus(String deviceStatus) {
        this.deviceStatus = deviceStatus;
    }

    public String getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
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
}
