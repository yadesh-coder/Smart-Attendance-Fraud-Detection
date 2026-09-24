package com.smartattendance.fraud.dto;

public class EvaluateFraudRequest {
    private String attemptId;
    private String sessionId;
    private Long studentUserId;
    private String qrStatus;
    private String faceStatus;
    private String deviceStatus;
    private String locationStatus;

    public EvaluateFraudRequest() {
    }

    public EvaluateFraudRequest(String attemptId, String sessionId, Long studentUserId,
                                String qrStatus, String faceStatus, String deviceStatus, String locationStatus) {
        this.attemptId = attemptId;
        this.sessionId = sessionId;
        this.studentUserId = studentUserId;
        this.qrStatus = qrStatus;
        this.faceStatus = faceStatus;
        this.deviceStatus = deviceStatus;
        this.locationStatus = locationStatus;
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
}
