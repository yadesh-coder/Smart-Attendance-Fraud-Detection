package com.smartattendance.attendance.dto;

public class QrValidationResponse {
    private String verificationAttemptId;
    private String sessionId;
    private String qrStatus;
    private String faceStatus;
    private String locationStatus;
    private String deviceStatus;
    private String overallStatus;

    public QrValidationResponse() {}

    public QrValidationResponse(String verificationAttemptId, String sessionId, String qrStatus, String faceStatus, String locationStatus, String deviceStatus, String overallStatus) {
        this.verificationAttemptId = verificationAttemptId;
        this.sessionId = sessionId;
        this.qrStatus = qrStatus;
        this.faceStatus = faceStatus;
        this.locationStatus = locationStatus;
        this.deviceStatus = deviceStatus;
        this.overallStatus = overallStatus;
    }

    public String getVerificationAttemptId() {
        return verificationAttemptId;
    }

    public String getAttemptId() {
        return verificationAttemptId;
    }

    public void setVerificationAttemptId(String verificationAttemptId) {
        this.verificationAttemptId = verificationAttemptId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
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
}
