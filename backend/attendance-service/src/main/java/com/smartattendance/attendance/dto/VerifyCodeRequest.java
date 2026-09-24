package com.smartattendance.attendance.dto;

public class VerifyCodeRequest {
    private String attendanceCode;

    public VerifyCodeRequest() {}

    public VerifyCodeRequest(String attendanceCode) {
        this.attendanceCode = attendanceCode;
    }

    public String getAttendanceCode() {
        return attendanceCode;
    }

    public void setAttendanceCode(String attendanceCode) {
        this.attendanceCode = attendanceCode;
    }
}
