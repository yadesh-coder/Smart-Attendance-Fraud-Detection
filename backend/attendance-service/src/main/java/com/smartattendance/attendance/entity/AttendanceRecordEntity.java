package com.smartattendance.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"session_id", "student_user_id"})
})
public class AttendanceRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "student_user_id", nullable = false)
    private Long studentUserId;

    @Column(name = "verification_attempt_id", length = 100)
    private String verificationAttemptId;

    @Column(name = "attendance_status", nullable = false, length = 20)
    private String attendanceStatus = "PENDING"; // PENDING, PRESENT, REJECTED

    @Column(nullable = false, length = 20)
    private String decision = "PENDING"; // PENDING, SAFE, SUSPICIOUS, FRAUD, REJECTED

    @Column(name = "marked_at", nullable = false)
    private LocalDateTime markedAt;

    public AttendanceRecordEntity() {
        this.markedAt = LocalDateTime.now();
    }

    public AttendanceRecordEntity(String sessionId, Long studentUserId, String verificationAttemptId) {
        this.sessionId = sessionId;
        this.studentUserId = studentUserId;
        this.verificationAttemptId = verificationAttemptId;
        this.attendanceStatus = "PENDING";
        this.decision = "PENDING";
        this.markedAt = LocalDateTime.now();
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

    public Long getStudentUserId() {
        return studentUserId;
    }

    public void setStudentUserId(Long studentUserId) {
        this.studentUserId = studentUserId;
    }

    public String getVerificationAttemptId() {
        return verificationAttemptId;
    }

    public void setVerificationAttemptId(String verificationAttemptId) {
        this.verificationAttemptId = verificationAttemptId;
    }

    public String getAttendanceStatus() {
        return attendanceStatus;
    }

    public void setAttendanceStatus(String attendanceStatus) {
        this.attendanceStatus = attendanceStatus;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public LocalDateTime getMarkedAt() {
        return markedAt;
    }

    public void setMarkedAt(LocalDateTime markedAt) {
        this.markedAt = markedAt;
    }
}
