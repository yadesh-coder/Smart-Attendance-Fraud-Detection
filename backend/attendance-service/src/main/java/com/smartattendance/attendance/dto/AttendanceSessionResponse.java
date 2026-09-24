package com.smartattendance.attendance.dto;

import java.time.LocalDateTime;

public class AttendanceSessionResponse {
    private Long id;
    private String sessionId;
    private Long facultyUserId;
    private String subjectId;
    private String subjectCode;
    private String subjectName;
    private String sessionDate;
    private String startTime;
    private String endTime;
    private String startAt; // ISO-8601 timestamp with offset, e.g., 2026-09-22T22:22:00+05:30
    private String endAt;   // ISO-8601 timestamp with offset, e.g., 2026-09-22T22:52:00+05:30
    private String status;
    private String qrToken; // Only present when session is created or owned by faculty caller. Never contains hash/secrets.
    private String attendanceCode; // Plaintext code visible only to Faculty caller
    private Double latitude;
    private Double longitude;
    private Double allowedRadiusMeters;
    private LocalDateTime qrExpiresAt;
    private LocalDateTime createdAt;

    public AttendanceSessionResponse() {}

    public AttendanceSessionResponse(Long id, String sessionId, Long facultyUserId, String subjectId, String subjectCode, String subjectName, String sessionDate, String startTime, String endTime, String status, String qrToken, String attendanceCode, Double latitude, Double longitude, Double allowedRadiusMeters, LocalDateTime qrExpiresAt, LocalDateTime createdAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.facultyUserId = facultyUserId;
        this.subjectId = subjectId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.sessionDate = sessionDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.qrToken = qrToken;
        this.attendanceCode = attendanceCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.allowedRadiusMeters = allowedRadiusMeters;
        this.qrExpiresAt = qrExpiresAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Long getFacultyUserId() {
        return facultyUserId;
    }

    public void setFacultyUserId(Long facultyUserId) {
        this.facultyUserId = facultyUserId;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(String sessionDate) {
        this.sessionDate = sessionDate;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getStartAt() {
        return startAt;
    }

    public void setStartAt(String startAt) {
        this.startAt = startAt;
    }

    public String getEndAt() {
        return endAt;
    }

    public void setEndAt(String endAt) {
        this.endAt = endAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public String getAttendanceCode() {
        return attendanceCode;
    }

    public void setAttendanceCode(String attendanceCode) {
        this.attendanceCode = attendanceCode;
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

    public Double getAllowedRadiusMeters() {
        return allowedRadiusMeters;
    }

    public void setAllowedRadiusMeters(Double allowedRadiusMeters) {
        this.allowedRadiusMeters = allowedRadiusMeters;
    }

    public LocalDateTime getQrExpiresAt() {
        return qrExpiresAt;
    }

    public void setQrExpiresAt(LocalDateTime qrExpiresAt) {
        this.qrExpiresAt = qrExpiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
