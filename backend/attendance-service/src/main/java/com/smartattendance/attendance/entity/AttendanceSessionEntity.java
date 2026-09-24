package com.smartattendance.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_sessions")
public class AttendanceSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, unique = true, length = 100)
    private String sessionId;

    @Column(name = "faculty_user_id", nullable = false)
    private Long facultyUserId;

    @Column(name = "subject_id", nullable = false, length = 100)
    private String subjectId;

    @Column(name = "subject_code", length = 100)
    private String subjectCode;

    @Column(name = "subject_name")
    private String subjectName;

    @Column(name = "session_date", nullable = false, length = 50)
    private String sessionDate;

    @Column(name = "start_time", nullable = false, length = 50)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 50)
    private String endTime;

    @Column(nullable = false, length = 20)
    private String status = "CREATED"; // CREATED, LIVE, CLOSED, EXPIRED

    @Column(name = "qr_token_hash", nullable = false, length = 255)
    private String qrTokenHash; // SHA-256 hash of plaintext QR token

    @Column(name = "plaintext_qr_token", length = 255)
    private String plaintextQrToken; // Plaintext QR token broadcast to faculty caller

    @Column(name = "qr_issued_at")
    private LocalDateTime qrIssuedAt;

    @Column(name = "qr_expires_at")
    private LocalDateTime qrExpiresAt;

    @Column(name = "attendance_code", length = 20)
    private String attendanceCode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "allowed_radius_meters")
    private Double allowedRadiusMeters = 100.0;

    @Column(name = "location_accuracy_meters")
    private Double locationAccuracyMeters;

    @Column(name = "location_timestamp")
    private Long locationTimestamp;

    @Column(name = "location_source", length = 50)
    private String locationSource = "BROWSER_GPS";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public AttendanceSessionEntity() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public AttendanceSessionEntity(String sessionId, Long facultyUserId, String subjectId, String subjectName, String sessionDate, String startTime, String endTime, String qrTokenHash) {
        this.sessionId = sessionId;
        this.facultyUserId = facultyUserId;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.sessionDate = sessionDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.qrTokenHash = qrTokenHash;
        this.status = "CREATED";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    public java.time.ZonedDateTime calculateEndDateTime() {
        try {
            java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
            String[] dateParts = this.sessionDate.split("-");
            String[] timeParts = this.endTime.split(":");
            int year = Integer.parseInt(dateParts[0]);
            int month = Integer.parseInt(dateParts[1]);
            int day = Integer.parseInt(dateParts[2]);
            int hour = Integer.parseInt(timeParts[0]);
            int minute = Integer.parseInt(timeParts[1]);
            return java.time.ZonedDateTime.of(year, month, day, hour, minute, 0, 0, zone);
        } catch (Exception e) {
            return null;
        }
    }

    public java.time.ZonedDateTime calculateStartDateTime() {
        try {
            java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
            String[] dateParts = this.sessionDate.split("-");
            String[] timeParts = this.startTime.split(":");
            int year = Integer.parseInt(dateParts[0]);
            int month = Integer.parseInt(dateParts[1]);
            int day = Integer.parseInt(dateParts[2]);
            int hour = Integer.parseInt(timeParts[0]);
            int minute = Integer.parseInt(timeParts[1]);
            return java.time.ZonedDateTime.of(year, month, day, hour, minute, 0, 0, zone);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isExpired(java.time.ZonedDateTime now) {
        if ("CLOSED".equalsIgnoreCase(this.status) || "EXPIRED".equalsIgnoreCase(this.status)) {
            return true;
        }
        java.time.ZonedDateTime endDt = calculateEndDateTime();
        if (endDt != null) {
            return !now.isBefore(endDt); // now >= endDt
        }
        return false;
    }

    public boolean isScheduled(java.time.ZonedDateTime now) {
        java.time.ZonedDateTime startDt = calculateStartDateTime();
        if (startDt != null) {
            return now.isBefore(startDt);
        }
        return "SCHEDULED".equalsIgnoreCase(this.status);
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrTokenHash() {
        return qrTokenHash;
    }

    public void setQrTokenHash(String qrTokenHash) {
        this.qrTokenHash = qrTokenHash;
    }

    public String getPlaintextQrToken() {
        return plaintextQrToken;
    }

    public void setPlaintextQrToken(String plaintextQrToken) {
        this.plaintextQrToken = plaintextQrToken;
    }

    public LocalDateTime getQrIssuedAt() {
        return qrIssuedAt;
    }

    public void setQrIssuedAt(LocalDateTime qrIssuedAt) {
        this.qrIssuedAt = qrIssuedAt;
    }

    public LocalDateTime getQrExpiresAt() {
        return qrExpiresAt;
    }

    public void setQrExpiresAt(LocalDateTime qrExpiresAt) {
        this.qrExpiresAt = qrExpiresAt;
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

    public String getLocationSource() {
        return locationSource;
    }

    public void setLocationSource(String locationSource) {
        this.locationSource = locationSource;
    }

    public String getAttendanceCode() {
        return attendanceCode;
    }

    public void setAttendanceCode(String attendanceCode) {
        this.attendanceCode = attendanceCode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
