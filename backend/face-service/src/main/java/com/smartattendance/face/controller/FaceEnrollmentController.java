package com.smartattendance.face.controller;



import com.smartattendance.face.dto.FaceEnrollmentResponse;

import com.smartattendance.face.exception.FaceProcessingException;

import com.smartattendance.face.service.FaceProcessingService;

import org.springframework.http.HttpStatus;

import org.springframework.http.MediaType;

import org.springframework.http.ResponseEntity;

import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;



import java.util.Map;



@RestController

@RequestMapping("/api/student/face")

public class FaceEnrollmentController {



    private final FaceProcessingService faceProcessingService;



    public FaceEnrollmentController(FaceProcessingService faceProcessingService) {

        this.faceProcessingService = faceProcessingService;

    }



    @PostMapping(value = "/enroll", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})

    public ResponseEntity<FaceEnrollmentResponse> enrollFaceMultipart(

            @RequestParam(value = "file", required = false) MultipartFile file,

            @RequestHeader(value = "Authorization", required = false) String bearerToken) {



        String studentEmail = getAuthenticatedStudentEmail();

        FaceEnrollmentResponse response = faceProcessingService.processFaceEnrollment(file, null, studentEmail, bearerToken);

        return ResponseEntity.ok(response);

    }



    @PostMapping(value = "/enroll", consumes = {MediaType.APPLICATION_JSON_VALUE})

    public ResponseEntity<FaceEnrollmentResponse> enrollFaceJson(

            @RequestBody Map<String, Object> body,

            @RequestHeader(value = "Authorization", required = false) String bearerToken) {



        String studentEmail = getAuthenticatedStudentEmail();



        if (body != null && body.containsKey("frames") && body.get("frames") instanceof java.util.List) {

            @SuppressWarnings("unchecked")

            java.util.List<String> frames = (java.util.List<String>) body.get("frames");

            FaceEnrollmentResponse response = faceProcessingService.processFaceEnrollmentMulti(frames, studentEmail, bearerToken);

            return ResponseEntity.ok(response);

        }



        String frameBase64 = body != null ? String.valueOf(body.getOrDefault("frameBase64", "")) : "";

        if (frameBase64.isBlank()) {

            if (body != null) {

                frameBase64 = String.valueOf(body.getOrDefault("frame", ""));

                if (frameBase64.isBlank()) {

                    frameBase64 = String.valueOf(body.getOrDefault("image", ""));

                }

            }

        }



        FaceEnrollmentResponse response = faceProcessingService.processFaceEnrollment(null, frameBase64, studentEmail, bearerToken);

        return ResponseEntity.ok(response);

    }



    @PostMapping(value = "/verify", consumes = {MediaType.APPLICATION_JSON_VALUE})

    public ResponseEntity<Map<String, Object>> verifyFaceJson(

            @RequestBody Map<String, String> body,

            @RequestHeader(value = "Authorization", required = false) String bearerToken) {



        String studentEmail = getAuthenticatedStudentEmail();

        String frameBase64 = body != null ? body.get("frameBase64") : null;

        if (frameBase64 == null || frameBase64.isBlank()) {

            if (body != null) {

                frameBase64 = body.get("frame");

                if (frameBase64 == null || frameBase64.isBlank()) {

                    frameBase64 = body.get("image");

                }

            }

        }

        String sessionId = body != null ? body.get("sessionId") : null;



        Map<String, Object> response = faceProcessingService.verifyFace(null, frameBase64, sessionId, studentEmail, bearerToken);

        return ResponseEntity.ok(response);

    }



    private String getAuthenticatedStudentEmail() {

        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {

            throw new FaceProcessingException("Unauthenticated requests are rejected.", HttpStatus.UNAUTHORIZED);

        }

        return auth.getName();

    }

}
