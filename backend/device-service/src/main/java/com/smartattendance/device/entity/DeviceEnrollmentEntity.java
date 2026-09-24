package com.smartattendance.device.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_enrollments", indexes = {
        @Index(name = "idx_student_email", columnList = "student_email", unique = true),
        @Index(name = "idx_fingerprint_hash", columnList = "device_fingerprint_hash")
})
public class DeviceEnrollmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_user_id")
    private Long studentUserId;

    @Column(name = "student_email", nullable = false, unique = true, length = 150)
    private String studentEmail;

    @Column(name = "device_fingerprint_hash", nullable = false, length = 255)
    private String deviceFingerprintHash;

    @Column(name = "device_label", length = 100)
    private String deviceLabel;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public DeviceEnrollmentEntity() {}

    public DeviceEnrollmentEntity(String studentEmail, String deviceFingerprintHash, String deviceLabel) {
        this.studentEmail = studentEmail;
        this.deviceFingerprintHash = deviceFingerprintHash;
        this.deviceLabel = deviceLabel;
        this.status = "COMPLETED";
        this.enrolledAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getStudentUserId() {
        return studentUserId;
    }

    public void setStudentUserId(Long studentUserId) {
        this.studentUserId = studentUserId;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
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
