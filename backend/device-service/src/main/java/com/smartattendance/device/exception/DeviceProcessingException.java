package com.smartattendance.device.exception;

import org.springframework.http.HttpStatus;

public class DeviceProcessingException extends RuntimeException {
    private final HttpStatus status;

    public DeviceProcessingException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
