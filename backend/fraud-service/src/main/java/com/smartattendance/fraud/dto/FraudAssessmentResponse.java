package com.smartattendance.fraud.dto;

import java.time.LocalDateTime;
import java.util.List;

public class FraudAssessmentResponse {
    private String assessmentId;
    private String attemptId;
    private String sessionId;
    private Long studentUserId;
    private String qrStatus;
    private String faceStatus;
    private String deviceStatus;
    private String locationStatus;
    private String riskLevel;
    private String decision;
    private List<TriggeredRuleDto> triggeredRules;
    private LocalDateTime createdAt;

    public FraudAssessmentResponse() {
    }

    public FraudAssessmentResponse(String assessmentId, String attemptId, String sessionId, Long studentUserId,
                                   String qrStatus, String faceStatus, String deviceStatus, String locationStatus,
                                   String riskLevel, String decision, List<TriggeredRuleDto> triggeredRules, LocalDateTime createdAt) {
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
        this.triggeredRules = triggeredRules;
        this.createdAt = createdAt;
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

    public List<TriggeredRuleDto> getTriggeredRules() {
        return triggeredRules;
    }

    public void setTriggeredRules(List<TriggeredRuleDto> triggeredRules) {
        this.triggeredRules = triggeredRules;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
