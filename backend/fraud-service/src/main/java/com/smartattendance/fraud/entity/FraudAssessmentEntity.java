package com.smartattendance.fraud.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_assessments")
public class FraudAssessmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assessment_id", nullable = false, unique = true, length = 64)
    private String assessmentId;

    @Column(name = "attempt_id", nullable = false, length = 64)
    private String attemptId;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(name = "student_user_id", nullable = false)
    private Long studentUserId;

    @Column(name = "qr_status", length = 32)
    private String qrStatus;

    @Column(name = "face_status", length = 32)
    private String faceStatus;

    @Column(name = "device_status", length = 32)
    private String deviceStatus;

    @Column(name = "location_status", length = 32)
    private String locationStatus;

    @Column(name = "risk_level", nullable = false, length = 32)
    private String riskLevel;

    @Column(name = "decision", nullable = false, length = 32)
    private String decision;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public FraudAssessmentEntity() {
    }

    public FraudAssessmentEntity(String assessmentId, String attemptId, String sessionId, Long studentUserId,
                                 String qrStatus, String faceStatus, String deviceStatus, String locationStatus,
                                 String riskLevel, String decision) {
        this.assessmentId = assessmentId;
        this.attemptId = attemptId;
        this.sessionId = sessionId;
        this.studentUserId = studentUserId;
        this.qrStatus = qrStatus;
        this.faceStatus = faceStatus;
        this.deviceStatus = deviceStatus;
        this.locationStatus = locationStatus;
        this.riskLevel = riskLevel;
        this.decision = decision;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(String assessmentId) {
        this.assessmentId = assessmentId;
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

    public String getDeviceStatus() {
        return deviceStatus;
    }

    public void setDeviceStatus(String deviceStatus) {
        this.deviceStatus = deviceStatus;
    }

    public String getLocationStatus() {
        return locationStatus;
    }

    public void setLocationStatus(String locationStatus) {
        this.locationStatus = locationStatus;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
