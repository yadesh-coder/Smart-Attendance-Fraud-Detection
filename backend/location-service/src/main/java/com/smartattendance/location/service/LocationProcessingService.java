package com.smartattendance.location.service;

import com.smartattendance.location.dto.AttendanceSessionDto;
import com.smartattendance.location.dto.LocationVerificationRequest;
import com.smartattendance.location.dto.LocationVerificationResponse;
import com.smartattendance.location.entity.LocationVerificationAttemptEntity;
import com.smartattendance.location.exception.LocationProcessingException;
import com.smartattendance.location.repository.LocationVerificationAttemptRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class LocationProcessingService {

    private static final double MAX_ACCURACY_THRESHOLD_METERS = 200.0;
    private static final int EARTH_RADIUS_METERS = 6371000;

    private final LocationVerificationAttemptRepository repository;
    private final AttendanceServiceClient attendanceServiceClient;

    public LocationProcessingService(LocationVerificationAttemptRepository repository,
                                      AttendanceServiceClient attendanceServiceClient) {
        this.repository = repository;
        this.attendanceServiceClient = attendanceServiceClient;
    }

    @Transactional
    public LocationVerificationResponse verifyLocation(LocationVerificationRequest request,
                                                        Long studentUserId,
                                                        String studentEmail,
                                                        String bearerToken) {
        // 1. Basic Request Validation
        if (request == null || request.getSessionId() == null || request.getSessionId().isBlank()) {
            throw new LocationProcessingException("Session ID is required for location verification.", HttpStatus.BAD_REQUEST);
        }

        Double lat = request.getLatitude();
        Double lon = request.getLongitude();

        // Check coordinates null / NaN / Infinity / Out of range
        if (lat == null || Double.isNaN(lat) || Double.isInfinite(lat) || lat < -90.0 || lat > 90.0 ||
            lon == null || Double.isNaN(lon) || Double.isInfinite(lon) || lon < -180.0 || lon > 180.0) {
            String status = "LOCATION_INVALID";
            saveAttempt(studentUserId, studentEmail, request.getSessionId(), lat, lon, request.getAccuracy(), status);
            attendanceServiceClient.updateLocationStatus(request.getSessionId(), studentUserId, status, bearerToken);
            return new LocationVerificationResponse(status, false, "Latitude or longitude coordinates are invalid or out of range.");
        }

        // Check accuracy invalid / negative / NaN / Infinity
        if (request.getAccuracy() != null) {
            Double acc = request.getAccuracy();
            if (Double.isNaN(acc) || Double.isInfinite(acc) || acc < 0.0) {
                String status = "LOCATION_INVALID";
                saveAttempt(studentUserId, studentEmail, request.getSessionId(), lat, lon, acc, status);
                attendanceServiceClient.updateLocationStatus(request.getSessionId(), studentUserId, status, bearerToken);
                return new LocationVerificationResponse(status, false, "Location accuracy is invalid (negative or non-numeric).");
            }
        }

        // Check Anti-Replay / Timestamp freshness
        if (request.getTimestamp() != null) {
            long currentMs = System.currentTimeMillis();
            long ageMs = currentMs - request.getTimestamp();
            if (request.getTimestamp() < 0 || ageMs > 300000 || ageMs < -60000) {
                String status = "LOCATION_STALE";
                saveAttempt(studentUserId, studentEmail, request.getSessionId(), lat, lon, request.getAccuracy(), status);
                attendanceServiceClient.updateLocationStatus(request.getSessionId(), studentUserId, status, bearerToken);
                return new LocationVerificationResponse(status, false, "Location timestamp is stale or invalid.");
            }
        }

        // 2. Fetch Session Details from Attendance Service
        AttendanceSessionDto session = attendanceServiceClient.getAttendanceSession(request.getSessionId(), bearerToken);
        if (session == null) {
            throw new LocationProcessingException("Attendance session not found: " + request.getSessionId(), HttpStatus.NOT_FOUND);
        }
        if (!"LIVE".equalsIgnoreCase(session.getStatus())) {
            throw new LocationProcessingException("Attendance session is not active (Status: " + session.getStatus() + ").", HttpStatus.BAD_REQUEST);
        }

        // Check session reference location nullability / radius validity
        if (session.getLatitude() == null || session.getLongitude() == null || session.getAllowedRadiusMeters() == null || session.getAllowedRadiusMeters() <= 0.0) {
            String status = "SESSION_LOCATION_UNAVAILABLE";
            saveAttempt(studentUserId, studentEmail, request.getSessionId(), lat, lon, request.getAccuracy(), status);
            attendanceServiceClient.updateLocationStatus(request.getSessionId(), studentUserId, status, bearerToken);
            return new LocationVerificationResponse(status, false, "Attendance session reference location is missing or invalid.");
        }

        double targetLat = session.getLatitude();
        double targetLon = session.getLongitude();
        double allowedRadius = session.getAllowedRadiusMeters();
        Double accuracy = request.getAccuracy() != null ? request.getAccuracy() : 10.0;

        // 3. Accuracy Evaluation
        if (accuracy > MAX_ACCURACY_THRESHOLD_METERS) {
            String status = "LOCATION_UNCERTAIN";
            saveAttempt(studentUserId, studentEmail, request.getSessionId(), lat, lon, accuracy, status);
            attendanceServiceClient.updateLocationStatus(request.getSessionId(), studentUserId, status, bearerToken);
            return new LocationVerificationResponse(status, false, "Location accuracy is too low to reliably verify position.");
        }

        // 4. Geographic Distance Calculation (Haversine Formula)
        double actualDistanceMeters = calculateHaversineDistance(lat, lon, targetLat, targetLon);

        // 5. Radius Check & Boundary Uncertainty Evaluation
        String status;
        boolean verified;
        String message;

        if (actualDistanceMeters <= allowedRadius) {
            // Boundary uncertainty check: near boundary (>80% radius) AND accuracy error bar spills outside radius
            if (actualDistanceMeters > (allowedRadius * 0.8) && (actualDistanceMeters + (accuracy * 0.5)) > (allowedRadius + 15.0)) {
                status = "LOCATION_UNCERTAIN";
                verified = false;
                message = "Location accuracy error is too large near the attendance boundary.";
            } else {
                status = "LOCATION_VALID";
                verified = true;
                message = "Location verified within session attendance area.";
            }
        } else {
            status = "LOCATION_OUTSIDE_RADIUS";
            verified = false;
            message = "Location is outside the configured session attendance radius.";
        }

        System.out.println(String.format(
            "Location verification diagnostic:\nsessionId=%s\nsessionLatitude=%.6f\nsessionLongitude=%.6f\nallowedRadius=%.1fm\nstudentLatitude=%.6f\nstudentLongitude=%.6f\nstudentAccuracy=%.1fm\nlocationTimestamp=%d\ncalculatedDistance=%.2fm\nfinalResult=%s\nverified=%b",
            request.getSessionId(), targetLat, targetLon, allowedRadius, lat, lon, accuracy, request.getTimestamp() != null ? request.getTimestamp() : System.currentTimeMillis(), actualDistanceMeters, status, verified
        ));

        // 6. Save Attempt to DB
        saveAttempt(studentUserId, studentEmail, request.getSessionId(), lat, lon, accuracy, status);

        // 7. Update Attendance Service Verification Status
        attendanceServiceClient.updateLocationStatus(request.getSessionId(), studentUserId, status, bearerToken);

        // 8. Return Response
        return new LocationVerificationResponse(status, verified, message, Math.round(actualDistanceMeters * 100.0) / 100.0);
    }

    private void saveAttempt(Long studentUserId, String studentEmail, String sessionId, Double lat, Double lon, Double accuracy, String status) {
        String attemptId = "LOC_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        LocationVerificationAttemptEntity entity = new LocationVerificationAttemptEntity(
                attemptId, studentUserId, studentEmail, sessionId, lat, lon, accuracy, status
        );
        repository.save(entity);
    }

    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}
