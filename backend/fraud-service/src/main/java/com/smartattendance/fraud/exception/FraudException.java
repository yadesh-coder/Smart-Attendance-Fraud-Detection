package com.smartattendance.fraud.exception;

import org.springframework.http.HttpStatus;

public class FraudException extends RuntimeException {
    private final HttpStatus status;

    public FraudException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
