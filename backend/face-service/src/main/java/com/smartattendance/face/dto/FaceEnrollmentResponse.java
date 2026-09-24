package com.smartattendance.face.dto;

public class FaceEnrollmentResponse {

    private String status;
    private String message;
    private boolean enrolled;

    public FaceEnrollmentResponse() {}

    public FaceEnrollmentResponse(String status, String message, boolean enrolled) {
        this.status = status;
        this.message = message;
        this.enrolled = enrolled;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEnrolled() {
        return enrolled;
    }

    public void setEnrolled(boolean enrolled) {
        this.enrolled = enrolled;
    }
}
