package com.smartattendance.attendance.dto;

public class CreateSessionRequest {
    private String subjectId;
    private String subjectCode;
    private String subjectName;
    private String sessionDate;
    private String startTime;
    private String endTime;
    private Double latitude;
    private Double longitude;
    private Double allowedRadiusMeters;
    private Double locationAccuracyMeters;
    private Long locationTimestamp;
    private Integer durationMinutes;

    public CreateSessionRequest() {}

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Double getLocationAccuracyMeters() {
        return locationAccuracyMeters;
    }

    public void setLocationAccuracyMeters(Double locationAccuracyMeters) {
        this.locationAccuracyMeters = locationAccuracyMeters;
    }

    public Long getLocationTimestamp() {
        return locationTimestamp;
    }

    public void setLocationTimestamp(Long locationTimestamp) {
        this.locationTimestamp = locationTimestamp;
    }

    public CreateSessionRequest(String subjectId, String subjectName, String sessionDate, String startTime, String endTime) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.sessionDate = sessionDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public CreateSessionRequest(String subjectId, String subjectName, String sessionDate, String startTime, String endTime, Double latitude, Double longitude, Double allowedRadiusMeters) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.sessionDate = sessionDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.latitude = latitude;
        this.longitude = longitude;
        this.allowedRadiusMeters = allowedRadiusMeters;
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
}
