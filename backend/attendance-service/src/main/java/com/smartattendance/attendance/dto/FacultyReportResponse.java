package com.smartattendance.attendance.dto;

import java.util.List;

public class FacultyReportResponse {
    private String sessionId;
    private String subjectId;
    private String subjectCode;
    private String subjectName;
    private String date;
    private String startTime;
    private String endTime;
    private Integer durationMinutes;
    private String department;
    private String semester;
    private String section;
    private String status;
    private Integer attendedCount;
    private Integer eligibleCount;
    private Double attendancePercentage;
    private List<AttendanceRecordResponse> participants;

    public FacultyReportResponse() {}

    public FacultyReportResponse(String sessionId, String subjectId, String subjectCode, String subjectName, String date, String startTime, String endTime, Integer durationMinutes, String department, String semester, String section, String status, Integer attendedCount, Integer eligibleCount, Double attendancePercentage, List<AttendanceRecordResponse> participants) {
        this.sessionId = sessionId;
        this.subjectId = subjectId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
        this.department = department;
        this.semester = semester;
        this.section = section;
        this.status = status;
        this.attendedCount = attendedCount;
        this.eligibleCount = eligibleCount;
        this.attendancePercentage = attendancePercentage;
        this.participants = participants;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
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

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
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

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getAttendedCount() {
        return attendedCount;
    }

    public void setAttendedCount(Integer attendedCount) {
        this.attendedCount = attendedCount;
    }

    public Integer getEligibleCount() {
        return eligibleCount;
    }

    public void setEligibleCount(Integer eligibleCount) {
        this.eligibleCount = eligibleCount;
    }

    public Double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(Double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }

    public List<AttendanceRecordResponse> getParticipants() {
        return participants;
    }

    public void setParticipants(List<AttendanceRecordResponse> participants) {
        this.participants = participants;
    }
}
