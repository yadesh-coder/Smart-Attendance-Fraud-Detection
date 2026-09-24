package com.smartattendance.student.dto;

public class CreateStudentRequest {

    private String email;
    private String password;
    private String fullName;
    private String studentId;
    private String phone;
    private String department;
    private String course;
    private String year;
    private String semester;
    private String section;

    public CreateStudentRequest() {}

    public CreateStudentRequest(String email, String password, String fullName, String studentId, String phone, String department, String course, String year, String section) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.studentId = studentId;
        this.phone = phone;
        this.department = department;
        this.course = course;
        this.year = year;
        this.section = section;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
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
}
