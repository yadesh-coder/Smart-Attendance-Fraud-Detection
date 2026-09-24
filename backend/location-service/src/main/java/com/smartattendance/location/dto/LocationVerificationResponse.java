package com.smartattendance.location.dto;

public class LocationVerificationResponse {
    private String status;
    private boolean verified;
    private String message;
    private Double distanceMeters;

    public LocationVerificationResponse() {}

    public LocationVerificationResponse(String status, boolean verified, String message) {
        this.status = status;
        this.verified = verified;
        this.message = message;
    }

    public LocationVerificationResponse(String status, boolean verified, String message, Double distanceMeters) {
        this.status = status;
        this.verified = verified;
        this.message = message;
        this.distanceMeters = distanceMeters;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }
}
