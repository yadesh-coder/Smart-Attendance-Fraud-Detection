package com.smartattendance.faculty.dto;

public class CreateSubjectRequest {
    private String subjectCode;
    private String subjectName;
    private String department;
    private String course;
    private String academicYear;
    private String semester;
    private String section;
    private String status;

    public CreateSubjectRequest() {}

    public CreateSubjectRequest(String subjectCode, String subjectName, String department, String course, String academicYear, String semester, String section) {
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.department = department;
        this.course = course;
        this.academicYear = academicYear;
        this.semester = semester;
        this.section = section;
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

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
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
}
