package com.smartattendance.face.exception;

import org.springframework.http.HttpStatus;

public class FaceProcessingException extends RuntimeException {
    private final HttpStatus status;

    public FaceProcessingException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
