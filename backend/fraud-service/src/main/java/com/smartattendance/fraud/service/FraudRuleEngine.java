package com.smartattendance.fraud.service;

import com.smartattendance.fraud.dto.TriggeredRuleDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class FraudRuleEngine {

    public static class EvaluationResult {
        private final String riskLevel;
        private final String decision;
        private final List<TriggeredRuleDto> triggeredRules;

        public EvaluationResult(String riskLevel, String decision, List<TriggeredRuleDto> triggeredRules) {
            this.riskLevel = riskLevel;
            this.decision = decision;
            this.triggeredRules = triggeredRules;
        }

        public String getRiskLevel() {
            return riskLevel;
        }

        public String getDecision() {
            return decision;
        }

        public List<TriggeredRuleDto> getTriggeredRules() {
            return triggeredRules;
        }
    }

    public EvaluationResult evaluate(String qrStatus, String faceStatus, String deviceStatus, String locationStatus) {
        List<TriggeredRuleDto> rules = new ArrayList<>();

        boolean isIncomplete = isNotAvailable(qrStatus) || isNotAvailable(faceStatus)
                || isNotAvailable(deviceStatus) || isNotAvailable(locationStatus);

        if (isIncomplete) {
            rules.add(new TriggeredRuleDto(
                    "R7_INCOMPLETE_PIPELINE",
                    "Multi-signal verification pipeline is incomplete. Awaiting required verification signals.",
                    "INFO"
            ));
        }

        // R1: Invalid QR / Code
        if (qrStatus != null && !"QR_VALID".equalsIgnoreCase(qrStatus) && !"NOT_AVAILABLE".equalsIgnoreCase(qrStatus)) {
            rules.add(new TriggeredRuleDto(
                    "R1_INVALID_QR_CODE",
                    "QR code or manual attendance code verification failed or is invalid.",
                    "CRITICAL"
            ));
        }

        // R2: Face Mismatch / Detection Failure
        if (faceStatus != null && ("FACE_MISMATCH".equalsIgnoreCase(faceStatus)
                || "NO_FACE_DETECTED".equalsIgnoreCase(faceStatus)
                || "MULTIPLE_FACES".equalsIgnoreCase(faceStatus))) {
            rules.add(new TriggeredRuleDto(
                    "R2_FACE_MISMATCH",
                    "Face verification failed or biometric mismatch detected.",
                    "CRITICAL"
            ));
        }

        // R3: Unenrolled Face
        if ("NOT_ENROLLED".equalsIgnoreCase(faceStatus)) {
            rules.add(new TriggeredRuleDto(
                    "R3_UNENROLLED_FACE",
                    "Student has not completed face biometric enrollment.",
                    "CRITICAL"
            ));
        }

        // R4: Location Out of Bounds
        if (locationStatus != null && ("OUT_OF_BOUNDS".equalsIgnoreCase(locationStatus)
                || "LOCATION_OUT_OF_BOUNDS".equalsIgnoreCase(locationStatus)
                || "LOCATION_INVALID".equalsIgnoreCase(locationStatus)
                || "LOCATION_SPOOFED".equalsIgnoreCase(locationStatus))) {
            rules.add(new TriggeredRuleDto(
                    "R4_LOCATION_OUT_OF_BOUNDS",
                    "Geolocation verification failed: Student is outside allowed attendance radius or GPS spoofing detected.",
                    "CRITICAL"
            ));
        }

        // R5: Device Mismatch
        if (deviceStatus != null && ("DEVICE_MISMATCH".equalsIgnoreCase(deviceStatus)
                || ("NOT_ENROLLED".equalsIgnoreCase(deviceStatus) && !"NOT_ENROLLED".equalsIgnoreCase(faceStatus)))) {
            rules.add(new TriggeredRuleDto(
                    "R5_DEVICE_MISMATCH",
                    "Device verification failed or un-enrolled device hardware fingerprint detected.",
                    "CRITICAL"
            ));
        }

        // R6: New Device Warning
        if ("NEW_DEVICE".equalsIgnoreCase(deviceStatus)) {
            rules.add(new TriggeredRuleDto(
                    "R6_NEW_DEVICE",
                    "Attendance submitted from a new unrecognized device.",
                    "WARNING"
            ));
        }

        boolean hasCritical = rules.stream().anyMatch(r -> "CRITICAL".equalsIgnoreCase(r.getSeverity()));
        boolean hasWarning = rules.stream().anyMatch(r -> "WARNING".equalsIgnoreCase(r.getSeverity()));

        String decision;
        String riskLevel;

        if (hasCritical) {
            decision = "REJECTED";
            riskLevel = "CRITICAL";
        } else if (isIncomplete) {
            decision = "PENDING";
            riskLevel = hasWarning ? "MEDIUM" : "LOW";
        } else if (hasWarning) {
            decision = "SUSPICIOUS";
            riskLevel = "HIGH";
        } else {
            decision = "SAFE";
            riskLevel = "LOW";
        }

        return new EvaluationResult(riskLevel, decision, rules);
    }

    private boolean isNotAvailable(String status) {
        return status == null || status.isBlank() || "NOT_AVAILABLE".equalsIgnoreCase(status);
    }
}
