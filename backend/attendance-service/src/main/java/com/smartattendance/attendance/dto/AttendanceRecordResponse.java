package com.smartattendance.attendance.dto;

import java.time.LocalDateTime;

public class AttendanceRecordResponse {
    private Long id;
    private String sessionId;
    private Long studentUserId;
    private String verificationAttemptId;
    private String attendanceStatus;
    private String decision;
    private String subjectCode;
    private String subjectName;
    private String studentName;
    private String studentRollNumber;
    private String department;
    private String semester;
    private String section;
    private String verificationStatus;
    private String fraudStatus;
    private String date;
    private String time;
    private LocalDateTime markedAt;

    public AttendanceRecordResponse() {}

    public AttendanceRecordResponse(Long id, String sessionId, Long studentUserId, String verificationAttemptId, String attendanceStatus, String decision, LocalDateTime markedAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.studentUserId = studentUserId;
        this.verificationAttemptId = verificationAttemptId;
        this.attendanceStatus = attendanceStatus;
        this.decision = decision;
        this.markedAt = markedAt;
    }

    public AttendanceRecordResponse(Long id, String sessionId, Long studentUserId, String verificationAttemptId, String attendanceStatus, String decision, String subjectCode, String subjectName, String verificationStatus, String fraudStatus, String date, String time, LocalDateTime markedAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.studentUserId = studentUserId;
        this.verificationAttemptId = verificationAttemptId;
        this.attendanceStatus = attendanceStatus;
        this.decision = decision;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.verificationStatus = verificationStatus;
        this.fraudStatus = fraudStatus;
        this.date = date;
        this.time = time;
        this.markedAt = markedAt;
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

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getFraudStatus() {
        return fraudStatus;
    }

    public void setFraudStatus(String fraudStatus) {
        this.fraudStatus = fraudStatus;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentRollNumber() {
        return studentRollNumber;
    }

    public void setStudentRollNumber(String studentRollNumber) {
        this.studentRollNumber = studentRollNumber;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }
}
