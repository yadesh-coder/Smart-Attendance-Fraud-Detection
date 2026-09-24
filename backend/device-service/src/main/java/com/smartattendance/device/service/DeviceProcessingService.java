package com.smartattendance.device.service;

import com.smartattendance.device.dto.DeviceEnrollmentResponse;
import com.smartattendance.device.dto.DeviceSignalDto;
import com.smartattendance.device.entity.DeviceEnrollmentEntity;
import com.smartattendance.device.exception.DeviceProcessingException;
import com.smartattendance.device.repository.DeviceEnrollmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DeviceProcessingService {

    private final DeviceEnrollmentRepository repository;
    private final StudentServiceClient studentServiceClient;

    public DeviceProcessingService(DeviceEnrollmentRepository repository, StudentServiceClient studentServiceClient) {
        this.repository = repository;
        this.studentServiceClient = studentServiceClient;
    }

    @Transactional
    public DeviceEnrollmentResponse processDeviceEnrollment(DeviceSignalDto dto, String studentEmail, String bearerToken) {
        if (studentEmail == null || studentEmail.isBlank()) {
            throw new DeviceProcessingException("Authenticated student identity required.", HttpStatus.UNAUTHORIZED);
        }

        if (dto == null || isPayloadInvalid(dto)) {
            throw new DeviceProcessingException("Invalid or incomplete device signal payload.", HttpStatus.BAD_REQUEST);
        }

        // 1. Normalize Signals into Canonical Representation
        String canonicalSignals = buildCanonicalSignals(dto);

        // 2. Generate Privacy-Preserving Cryptographic Hash (SHA-256)
        String deviceFingerprintHash = generateDeviceFingerprintHash(canonicalSignals, studentEmail);

        // 3. Resolve Device Label
        String deviceLabel = dto.getDeviceLabel();
        if (deviceLabel == null || deviceLabel.isBlank()) {
            deviceLabel = (dto.getPlatform() != null ? dto.getPlatform() : "Web") + " Browser";
        }

        // 4. Duplicate / Conflict Handling
        Optional<DeviceEnrollmentEntity> existingWithSameHash = repository.findByDeviceFingerprintHash(deviceFingerprintHash);
        if (existingWithSameHash.isPresent()) {
            DeviceEnrollmentEntity existing = existingWithSameHash.get();
            if (!existing.getStudentEmail().equalsIgnoreCase(studentEmail)) {
                throw new DeviceProcessingException("This device is already registered to another student account.", HttpStatus.CONFLICT);
            }
        }

        // 5. Save or Update Student Device Enrollment Entity
        final String hash = deviceFingerprintHash;
        final String label = deviceLabel;
        DeviceEnrollmentEntity entity = repository.findByStudentEmailIgnoreCase(studentEmail)
                .orElseGet(() -> new DeviceEnrollmentEntity(studentEmail, hash, label));

        entity.setDeviceFingerprintHash(deviceFingerprintHash);
        entity.setDeviceLabel(deviceLabel);
        entity.setStatus("COMPLETED");
        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);

        // 6. Notify Student Service via Internal REST Client
        studentServiceClient.registerDeviceEnrollment(deviceFingerprintHash, deviceLabel, bearerToken);

        // 7. Return Safe Response (Privacy Rule: Never expose raw signals or fingerprint hash)
        return new DeviceEnrollmentResponse("COMPLETED", "Device enrolled successfully.", true);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> verifyDevice(DeviceSignalDto dto, String studentEmail, String bearerToken) {
        if (studentEmail == null || studentEmail.isBlank()) {
            throw new DeviceProcessingException("Authenticated student identity required.", HttpStatus.UNAUTHORIZED);
        }

        if (dto == null || isPayloadInvalid(dto)) {
            throw new DeviceProcessingException("Invalid or incomplete device signal payload.", HttpStatus.BAD_REQUEST);
        }

        String canonicalSignals = buildCanonicalSignals(dto);
        String deviceFingerprintHash = generateDeviceFingerprintHash(canonicalSignals, studentEmail);

        Optional<DeviceEnrollmentEntity> existing = repository.findByStudentEmailIgnoreCase(studentEmail);
        if (existing.isEmpty()) {
            return java.util.Map.of("status", "NOT_ENROLLED", "verified", false, "message", "Student has not enrolled any device.");
        }

        DeviceEnrollmentEntity enrolled = existing.get();
        if (enrolled.getDeviceFingerprintHash().equalsIgnoreCase(deviceFingerprintHash)) {
            return java.util.Map.of("status", "DEVICE_VALID", "verified", true, "message", "Device fingerprint verified successfully.");
        } else {
            return java.util.Map.of("status", "DEVICE_MISMATCH", "verified", false, "message", "Hardware device fingerprint mismatch.");
        }
    }

    private boolean isPayloadInvalid(DeviceSignalDto dto) {
        return (dto.getUserAgent() == null || dto.getUserAgent().isBlank()) &&
               (dto.getPlatform() == null || dto.getPlatform().isBlank()) &&
               (dto.getScreenDimensions() == null || dto.getScreenDimensions().isBlank());
    }

    private String buildCanonicalSignals(DeviceSignalDto dto) {
        StringBuilder sb = new StringBuilder();
        sb.append(dto.getUserAgent() != null ? dto.getUserAgent().trim() : "").append("|");
        sb.append(dto.getPlatform() != null ? dto.getPlatform().trim() : "").append("|");
        sb.append(dto.getLanguage() != null ? dto.getLanguage().trim() : "").append("|");
        sb.append(dto.getScreenDimensions() != null ? dto.getScreenDimensions().trim() : "").append("|");
        sb.append(dto.getTimezone() != null ? dto.getTimezone().trim() : "").append("|");
        sb.append(dto.getHardwareConcurrency() != null ? dto.getHardwareConcurrency().trim() : "").append("|");
        sb.append(dto.getDeviceMemory() != null ? dto.getDeviceMemory().trim() : "").append("|");
        sb.append(dto.getTouchSupport() != null ? dto.getTouchSupport().trim() : "");
        return sb.toString();
    }

    private String generateDeviceFingerprintHash(String canonicalSignals, String studentEmail) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(canonicalSignals.getBytes(StandardCharsets.UTF_8));
            byte[] hash = md.digest();

            StringBuilder sb = new StringBuilder("dev_v1_");
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "dev_v1_" + System.currentTimeMillis() + "_" + Math.abs(canonicalSignals.hashCode());
        }
    }
}
