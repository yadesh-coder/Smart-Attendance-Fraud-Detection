package com.smartattendance.attendance.dto;

public class VerifyQrRequest {
    private String sessionId;
    private String qrToken;

    public VerifyQrRequest() {}

    public VerifyQrRequest(String qrToken) {
        this.qrToken = qrToken;
    }

    public VerifyQrRequest(String sessionId, String qrToken) {
        this.sessionId = sessionId;
        this.qrToken = qrToken;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }
}
