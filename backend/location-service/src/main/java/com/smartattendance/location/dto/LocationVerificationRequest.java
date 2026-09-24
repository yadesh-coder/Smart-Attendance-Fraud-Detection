package com.smartattendance.location.dto;

public class LocationVerificationRequest {
    private String sessionId;
    private Double latitude;
    private Double longitude;
    private Double accuracy;

    public LocationVerificationRequest() {}

    public LocationVerificationRequest(String sessionId, Double latitude, Double longitude, Double accuracy) {
        this.sessionId = sessionId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracy = accuracy;
    }

    private String attemptId;
    private Long timestamp;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(String attemptId) {
        this.attemptId = attemptId;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }
}
