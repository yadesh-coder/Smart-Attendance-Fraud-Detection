package com.smartattendance.student.exception;

import org.springframework.http.HttpStatus;

public class StudentException extends RuntimeException {

    private final HttpStatus status;

    public StudentException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
