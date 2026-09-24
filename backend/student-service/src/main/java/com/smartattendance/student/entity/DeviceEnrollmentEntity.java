package com.smartattendance.student.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_enrollments")
public class DeviceEnrollmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "device_fingerprint_hash", length = 255)
    private String deviceFingerprintHash; // SHA-256 privacy hash, never raw device serial/MAC

    @Column(name = "device_label", length = 100)
    private String deviceLabel;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    @Column(name = "enrolled_at")
    private LocalDateTime enrolledAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public DeviceEnrollmentEntity() {
        this.updatedAt = LocalDateTime.now();
    }

    public DeviceEnrollmentEntity(Long studentId) {
        this.studentId = studentId;
        this.status = "PENDING";
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getDeviceFingerprintHash() {
        return deviceFingerprintHash;
    }

    public void setDeviceFingerprintHash(String deviceFingerprintHash) {
        this.deviceFingerprintHash = deviceFingerprintHash;
    }

    public String getDeviceLabel() {
        return deviceLabel;
    }

    public void setDeviceLabel(String deviceLabel) {
        this.deviceLabel = deviceLabel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
