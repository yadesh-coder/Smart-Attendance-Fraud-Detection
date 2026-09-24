package com.smartattendance.student.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class UpdateStudentRequest {
    @JsonAlias({"name", "full_name", "fullName"})
    private String fullName;
    private String phone;
    private String department;
    private String course;
    @JsonAlias({"year", "academicYear", "academic_year", "semester"})
    private String year;
    private String semester;
    private String section;
    private String status;

    public UpdateStudentRequest() {}

    public UpdateStudentRequest(String fullName, String phone, String department, String course, String year, String section, String status) {
        this.fullName = fullName;
        this.phone = phone;
        this.department = department;
        this.course = course;
        this.year = year;
        this.section = section;
        this.status = status;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getName() {
        return fullName;
    }

    public void setName(String name) {
        this.fullName = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public String getYear() {
        return year != null ? year : semester;
    }

    public void setYear(String year) {
        this.year = year;
        if (this.semester == null) this.semester = year;
    }

    public String getSemester() {
        return semester != null ? semester : year;
    }

    public void setSemester(String semester) {
        this.semester = semester;
        if (this.year == null) this.year = semester;
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
