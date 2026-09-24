package com.smartattendance.student.dto;

public class EnrollmentStatusResponse {

    private String enrollmentStatus; // PENDING, IN_PROGRESS, COMPLETED
    private boolean personalDetailsConfirmed;
    private String faceEnrollmentStatus; // PENDING, COMPLETED
    private String deviceEnrollmentStatus; // PENDING, COMPLETED
    private boolean isEnrollmentComplete;

    public EnrollmentStatusResponse() {}

    public EnrollmentStatusResponse(String enrollmentStatus, boolean personalDetailsConfirmed, String faceEnrollmentStatus, String deviceEnrollmentStatus, boolean isEnrollmentComplete) {
        this.enrollmentStatus = enrollmentStatus;
        this.personalDetailsConfirmed = personalDetailsConfirmed;
        this.faceEnrollmentStatus = faceEnrollmentStatus;
        this.deviceEnrollmentStatus = deviceEnrollmentStatus;
        this.isEnrollmentComplete = isEnrollmentComplete;
    }

    public String getEnrollmentStatus() {
        return enrollmentStatus;
    }

    public void setEnrollmentStatus(String enrollmentStatus) {
        this.enrollmentStatus = enrollmentStatus;
    }

    public boolean isPersonalDetailsConfirmed() {
        return personalDetailsConfirmed;
    }

    public void setPersonalDetailsConfirmed(boolean personalDetailsConfirmed) {
        this.personalDetailsConfirmed = personalDetailsConfirmed;
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

    public boolean isEnrollmentComplete() {
        return isEnrollmentComplete;
    }

    public void setEnrollmentComplete(boolean enrollmentComplete) {
        isEnrollmentComplete = enrollmentComplete;
    }
}
