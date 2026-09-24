package com.smartattendance.location.exception;

import org.springframework.http.HttpStatus;

public class LocationProcessingException extends RuntimeException {
    private final HttpStatus status;

    public LocationProcessingException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
