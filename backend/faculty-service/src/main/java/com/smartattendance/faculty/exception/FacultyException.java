package com.smartattendance.faculty.exception;

import org.springframework.http.HttpStatus;

public class FacultyException extends RuntimeException {

    private final HttpStatus status;

    public FacultyException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
