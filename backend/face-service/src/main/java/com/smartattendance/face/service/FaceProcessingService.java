package com.smartattendance.face.service;

import com.smartattendance.face.dto.FaceEnrollmentResponse;
import com.smartattendance.face.exception.FaceProcessingException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FaceProcessingService {

    private static final double SIMILARITY_THRESHOLD = 0.82;
    private static final String ML_SERVICE_URL = "http://localhost:8090/api/ml/face/embedding";

    private final StudentServiceClient studentServiceClient;
    private final RestTemplate restTemplate;

    public FaceProcessingService(StudentServiceClient studentServiceClient) {
        this.studentServiceClient = studentServiceClient;
        this.restTemplate = new RestTemplate();
    }

    public FaceEnrollmentResponse processFaceEnrollment(MultipartFile file, String frameBase64, String studentEmail, String bearerToken) {
        if (studentEmail == null || studentEmail.isBlank()) {
            throw new FaceProcessingException("Authenticated student identity required.", HttpStatus.UNAUTHORIZED);
        }

        String imageB64 = prepareBase64Image(file, frameBase64);
        if (imageB64 == null || imageB64.isBlank()) {
            throw new FaceProcessingException("No image frame provided for face enrollment.", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> mlResult = callMlServiceEmbedding(imageB64);
        String status = (String) mlResult.get("status");

        if ("SERVICE_UNAVAILABLE".equals(status)) {
            throw new FaceProcessingException("ML face recognition service is currently unavailable. Please ensure ML service is running.", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if ("FACE_NOT_DETECTED".equals(status)) {
            throw new FaceProcessingException("No face detected in submitted frame.", HttpStatus.BAD_REQUEST);
        }
        if ("MULTIPLE_FACES_DETECTED".equals(status) || "MULTIPLE_FACES".equals(status)) {
            throw new FaceProcessingException("Multiple faces detected in frame. Please capture a single face.", HttpStatus.BAD_REQUEST);
        }
        if (!"OK".equals(status) || !Boolean.TRUE.equals(mlResult.get("verified"))) {
            String detailMsg = (String) mlResult.getOrDefault("message", "Invalid face frame or quality check failed.");
            throw new FaceProcessingException(detailMsg, HttpStatus.BAD_REQUEST);
        }

        @SuppressWarnings("unchecked")
        List<Double> embedding = (List<Double>) mlResult.get("embedding");
        if (embedding == null || embedding.isEmpty() || embedding.size() != 512) {
            throw new FaceProcessingException("Failed to extract valid 512D ArcFace embedding.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String templateReference = serializeEmbedding(embedding);
        boolean registered = studentServiceClient.registerFaceTemplate(templateReference, bearerToken);
        if (!registered) {
            throw new FaceProcessingException("Failed to persist face template to Student database.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String frameId = String.valueOf(mlResult.getOrDefault("frameId", "FRM_ENROLL"));
        System.out.println(String.format("Face enrollment diagnostic: studentId=%s, frameId=%s, model=ArcFace, modelFile=w600k_mbf.onnx, embeddingDimension=512, status=COMPLETED", studentEmail, frameId));

        return new FaceEnrollmentResponse("COMPLETED", "Face biometric enrollment processed successfully.", true);
    }

    public FaceEnrollmentResponse processFaceEnrollmentMulti(List<String> frames, String studentEmail, String bearerToken) {
        if (studentEmail == null || studentEmail.isBlank()) {
            throw new FaceProcessingException("Authenticated student identity required.", HttpStatus.UNAUTHORIZED);
        }
        if (frames == null || frames.isEmpty()) {
            throw new FaceProcessingException("No face image samples provided for enrollment.", HttpStatus.BAD_REQUEST);
        }
        List<List<Double>> embeddings = new java.util.ArrayList<>();
        for (String frameB64 : frames) {
            String imageB64 = prepareBase64Image(null, frameB64);
            if (imageB64 != null && !imageB64.isBlank()) {
                try {
                    Map<String, Object> mlResult = callMlServiceEmbedding(imageB64);
                    if ("OK".equals(mlResult.get("status")) && Boolean.TRUE.equals(mlResult.get("verified"))) {
                        @SuppressWarnings("unchecked")
                        List<Double> emb = (List<Double>) mlResult.get("embedding");
                        if (emb != null && emb.size() == 512) {
                            embeddings.add(emb);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }
        if (embeddings.isEmpty()) {
            throw new FaceProcessingException("Failed to extract valid 512D ArcFace embedding from provided frames.", HttpStatus.BAD_REQUEST);
        }

        List<Double> meanEmbedding = computeMeanEmbedding(embeddings);
        String templateReference = serializeEmbedding(meanEmbedding);
        boolean registered = studentServiceClient.registerFaceTemplate(templateReference, bearerToken);
        if (!registered) {
            throw new FaceProcessingException("Failed to persist face template to Student database.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        System.out.println(String.format("Multi-sample face enrollment diagnostic: studentId=%s, samplesProcessed=%d, model=ArcFace, modelFile=w600k_mbf.onnx, embeddingDimension=512, status=COMPLETED", studentEmail, embeddings.size()));

        return new FaceEnrollmentResponse("COMPLETED", "Face biometric multi-sample enrollment processed successfully.", true);
    }

    private List<Double> computeMeanEmbedding(List<List<Double>> list) {
        int dim = 512;
        double[] sum = new double[dim];
        for (List<Double> emb : list) {
            for (int i = 0; i < dim; i++) {
                sum[i] += emb.get(i);
            }
        }
        double sqSum = 0.0;
        for (int i = 0; i < dim; i++) {
            sum[i] /= list.size();
            sqSum += sum[i] * sum[i];
        }
        double norm = Math.sqrt(sqSum);
        List<Double> result = new java.util.ArrayList<>();
        for (int i = 0; i < dim; i++) {
            result.add(norm > 0 ? sum[i] / norm : sum[i]);
        }
        return result;
    }

    public Map<String, Object> verifyFace(MultipartFile file, String frameBase64, String sessionId, String studentEmail, String bearerToken) {
        if (studentEmail == null || studentEmail.isBlank()) {
            throw new FaceProcessingException("Authenticated student identity required.", HttpStatus.UNAUTHORIZED);
        }

        String requestId = "REQ_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        // 1. Fetch authenticated student's stored face enrollment from STUDENT-SERVICE
        Map<String, Object> stored = studentServiceClient.getStoredFaceTemplate(bearerToken);
        Object enrolledObj = stored != null ? stored.get("enrolled") : null;
        boolean isEnrolled = Boolean.TRUE.equals(enrolledObj) || "COMPLETED".equals(stored != null ? stored.get("status") : null);

        if (!isEnrolled) {
            return Map.of(
                "status", "FACE_ENROLLMENT_REQUIRED",
                "verified", false,
                "isMatch", false,
                "similarity", 0.0,
                "message", "Student has not completed initial face biometric enrollment."
            );
        }

        String storedTemplateRef = (String) stored.get("templateReference");
        List<Double> storedEmbedding = deserializeEmbedding(storedTemplateRef);
        if (storedEmbedding == null || storedEmbedding.isEmpty()) {
            return Map.of(
                "status", "FACE_ENROLLMENT_REQUIRED",
                "verified", false,
                "isMatch", false,
                "similarity", 0.0,
                "message", "Stored biometric enrollment is missing or corrupt."
            );
        }

        // 2. Decode live captured frame
        String imageB64 = prepareBase64Image(file, frameBase64);
        if (imageB64 == null || imageB64.isBlank()) {
            return Map.of(
                "status", "FACE_INVALID",
                "verified", false,
                "isMatch", false,
                "similarity", 0.0,
                "message", "No image frame provided for face verification."
            );
        }

        // 3. Call ML-SERVICE for ArcFace embedding of live image
        Map<String, Object> mlResult = callMlServiceEmbedding(imageB64);
        String mlStatus = (String) mlResult.get("status");
        int facesDetected = mlResult.get("facesDetected") instanceof Number ? ((Number) mlResult.get("facesDetected")).intValue() : 0;
        String frameId = String.valueOf(mlResult.getOrDefault("frameId", "FRM_UNKNOWN"));
        Object frameTimestamp = mlResult.getOrDefault("frameTimestamp", System.currentTimeMillis());
        Object imageDimensions = mlResult.getOrDefault("imageDimensions", "UNKNOWN");
        Object imageByteLength = mlResult.getOrDefault("imageByteLength", 0);

        if ("FACE_NOT_DETECTED".equals(mlStatus) || facesDetected == 0) {
            System.out.println(String.format("Face verification diagnostic: requestId=%s, studentId=%s, frameId=%s, frameTimestamp=%s, imageDimensions=%s, imageByteLength=%s, detector=SCRFD, model=ArcFace, modelFile=w600k_mbf.onnx, faceCount=0, result=FACE_NOT_DETECTED",
                    requestId, studentEmail, frameId, frameTimestamp, imageDimensions, imageByteLength));
            return Map.of(
                "status", "FACE_NOT_DETECTED",
                "verified", false,
                "isMatch", false,
                "similarity", 0.0,
                "frameId", frameId,
                "message", "No human face detected in submitted frame."
            );
        }

        if ("MULTIPLE_FACES".equals(mlStatus) || "MULTIPLE_FACES_DETECTED".equals(mlStatus) || facesDetected > 1) {
            System.out.println(String.format("Face verification diagnostic: requestId=%s, studentId=%s, frameId=%s, frameTimestamp=%s, imageDimensions=%s, imageByteLength=%s, detector=SCRFD, model=ArcFace, modelFile=w600k_mbf.onnx, faceCount=%d, result=MULTIPLE_FACES_DETECTED",
                    requestId, studentEmail, frameId, frameTimestamp, imageDimensions, imageByteLength, facesDetected));
            return Map.of(
                "status", "MULTIPLE_FACES_DETECTED",
                "verified", false,
                "isMatch", false,
                "similarity", 0.0,
                "frameId", frameId,
                "message", "Multiple human faces detected in frame."
            );
        }

        if (!"OK".equals(mlStatus) || !Boolean.TRUE.equals(mlResult.get("verified"))) {
            return Map.of(
                "status", "INVALID_FACE_FRAME",
                "verified", false,
                "isMatch", false,
                "similarity", 0.0,
                "frameId", frameId,
                "message", "Invalid image frame."
            );
        }

        @SuppressWarnings("unchecked")
        List<Double> liveEmbedding = (List<Double>) mlResult.get("embedding");
        if (liveEmbedding == null || liveEmbedding.isEmpty()) {
            return Map.of(
                "status", "INVALID_FACE_FRAME",
                "verified", false,
                "isMatch", false,
                "similarity", 0.0,
                "frameId", frameId,
                "message", "Failed to extract live ArcFace embedding."
            );
        }

        // 4. Compute Cosine Similarity between 512D ArcFace embeddings
        double similarity = computeCosineSimilarity(storedEmbedding, liveEmbedding);
        boolean isMatch = similarity >= SIMILARITY_THRESHOLD;

        double storedNorm = computeL2Norm(storedEmbedding);
        double liveNorm = computeL2Norm(liveEmbedding);

        System.out.println(String.format("Face verification diagnostic: requestId=%s, studentId=%s, storedEnrollmentExists=true, storedEmbeddingDimension=%d, liveEmbeddingDimension=%d, detector=SCRFD, model=ArcFace, modelFile=w600k_mbf.onnx, faceCount=1, storedEmbeddingNorm=%.4f, liveEmbeddingNorm=%.4f, frameId=%s, frameTimestamp=%s, imageDimensions=%s, imageByteLength=%s, cosineSimilarity=%.4f, threshold=%.4f, finalResult=%s",
                requestId, studentEmail, storedEmbedding.size(), liveEmbedding.size(), storedNorm, liveNorm, frameId, frameTimestamp, imageDimensions, imageByteLength, similarity, SIMILARITY_THRESHOLD, isMatch ? "FACE_MATCH" : "FACE_MISMATCH"));

        if (isMatch) {
            return Map.of(
                "status", "FACE_MATCH",
                "verified", true,
                "isMatch", true,
                "similarity", Math.round(similarity * 10000.0) / 10000.0,
                "threshold", SIMILARITY_THRESHOLD,
                "model", "ArcFace",
                "embeddingDimension", 512,
                "frameId", frameId,
                "requestId", requestId,
                "message", "Face biometric verified successfully against stored enrollment."
            );
        } else {
            return Map.of(
                "status", "FACE_MISMATCH",
                "verified", false,
                "isMatch", false,
                "similarity", Math.round(similarity * 10000.0) / 10000.0,
                "threshold", SIMILARITY_THRESHOLD,
                "model", "ArcFace",
                "embeddingDimension", 512,
                "frameId", frameId,
                "requestId", requestId,
                "message", "Face biometric mismatch. Submitted face does not match stored student enrollment."
            );
        }
    }

    private Map<String, Object> callMlServiceEmbedding(String imageB64) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, String> body = Map.of("image", imageB64);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(ML_SERVICE_URL, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> resBody = (Map<String, Object>) response.getBody();
                return resBody;
            }
        } catch (Exception e) {
            System.err.println("Error calling ML service ArcFace endpoint (http://localhost:8090/api/ml/face/embedding): " + e.getMessage());
        }
        return Map.of("status", "SERVICE_UNAVAILABLE", "verified", false, "facesDetected", 0, "message", "ML face recognition service is currently unavailable.");
    }

    private String prepareBase64Image(MultipartFile file, String frameBase64) {
        try {
            if (file != null && !file.isEmpty()) {
                return Base64.getEncoder().encodeToString(file.getBytes());
            }
            if (frameBase64 != null && !frameBase64.isBlank()) {
                String clean = frameBase64;
                if (clean.contains(",")) {
                    clean = clean.split(",")[1];
                }
                return clean.replaceAll("\\s+", "");
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private String serializeEmbedding(List<Double> embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.size(); i++) {
            sb.append(embedding.get(i));
            if (i < embedding.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    private double computeL2Norm(List<Double> vec) {
        if (vec == null || vec.isEmpty()) return 0.0;
        double sum = 0.0;
        for (double d : vec) {
            sum += d * d;
        }
        return Math.sqrt(sum);
    }

    private List<Double> deserializeEmbedding(String ref) {
        if (ref == null || !ref.startsWith("[") || !ref.endsWith("]")) {
            return null;
        }
        try {
            String inner = ref.substring(1, ref.length() - 1);
            String[] parts = inner.split(",");
            List<Double> list = new java.util.ArrayList<>();
            for (String p : parts) {
                list.add(Double.parseDouble(p.trim()));
            }
            return list;
        } catch (Exception e) {
            return null;
        }
    }

    private double computeCosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1 == null || v2 == null || v1.size() != v2.size() || v1.isEmpty()) {
            return 0.0;
        }
        double dot = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;
        for (int i = 0; i < v1.size(); i++) {
            double d1 = v1.get(i);
            double d2 = v2.get(i);
            dot += d1 * d2;
            norm1 += d1 * d1;
            norm2 += d2 * d2;
        }
        if (norm1 == 0 || norm2 == 0) return 0.0;
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
}
