package com.smartattendance.student.service;

import com.smartattendance.student.dto.CreateStudentRequest;
import com.smartattendance.student.dto.EnrollmentStatusResponse;
import com.smartattendance.student.dto.StudentResponse;
import com.smartattendance.student.entity.DeviceEnrollmentEntity;
import com.smartattendance.student.entity.FaceEnrollmentEntity;
import com.smartattendance.student.entity.StudentEntity;
import com.smartattendance.student.exception.StudentException;
import com.smartattendance.student.repository.DeviceEnrollmentRepository;
import com.smartattendance.student.repository.FaceEnrollmentRepository;
import com.smartattendance.student.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final FaceEnrollmentRepository faceEnrollmentRepository;
    private final DeviceEnrollmentRepository deviceEnrollmentRepository;
    private final AuthServiceClient authServiceClient;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public StudentService(StudentRepository studentRepository,
                          FaceEnrollmentRepository faceEnrollmentRepository,
                          DeviceEnrollmentRepository deviceEnrollmentRepository,
                          AuthServiceClient authServiceClient,
                          org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.studentRepository = studentRepository;
        this.faceEnrollmentRepository = faceEnrollmentRepository;
        this.deviceEnrollmentRepository = deviceEnrollmentRepository;
        this.authServiceClient = authServiceClient;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public StudentResponse createStudent(CreateStudentRequest request, String bearerToken) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new StudentException("Email is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getStudentId() == null || request.getStudentId().isBlank()) {
            throw new StudentException("Student ID / Roll Number is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new StudentException("Full name is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new StudentException("Initial password is required.", HttpStatus.BAD_REQUEST);
        }

        String email = request.getEmail().trim().toLowerCase();
        String studentId = request.getStudentId().trim().toUpperCase();

        org.slf4j.LoggerFactory.getLogger(StudentService.class).info(
            "[STUDENT CREATION TRACE] source=API_ENDPOINT caller=FacultyStudentController endpoint=POST /api/faculty/students timestamp={} studentId={} email={}",
            java.time.LocalDateTime.now(), studentId, email
        );

        if (studentRepository.existsByEmailIgnoreCase(email)) {
            throw new StudentException("A student with this email already exists.", HttpStatus.CONFLICT);
        }
        if (studentRepository.existsByStudentIdIgnoreCase(studentId)) {
            throw new StudentException("A student with this student ID already exists.", HttpStatus.CONFLICT);
        }

        // 1. Create student identity in Auth Service via HTTP
        Long userId = authServiceClient.createAuthUser(email, request.getPassword(), request.getFullName(), bearerToken);

        // 2. Create student profile record
        StudentEntity student = new StudentEntity(
                userId,
                studentId,
                request.getFullName(),
                email,
                request.getPhone(),
                request.getDepartment() != null ? request.getDepartment() : "Computer Science & Engineering",
                request.getCourse() != null ? request.getCourse() : "B.Tech",
                request.getYear() != null ? request.getYear() : "1",
                request.getSection() != null ? request.getSection() : "A"
        );

        StudentEntity saved = studentRepository.save(student);

        // 3. Initialize face & device enrollment records in PENDING state
        faceEnrollmentRepository.save(new FaceEnrollmentEntity(saved.getId()));
        deviceEnrollmentRepository.save(new DeviceEnrollmentEntity(saved.getId()));

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        StudentEntity student = studentRepository.findById(id)
                .or(() -> studentRepository.findByUserId(id))
                .orElseThrow(() -> new StudentException("Student record not found for ID: " + id, HttpStatus.NOT_FOUND));
        return mapToResponse(student);
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentProfile(String email) {
        StudentEntity student = studentRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new StudentException("Student profile not found for email: " + email, HttpStatus.NOT_FOUND));
        return mapToResponse(student);
    }

    @Transactional
    public StudentResponse updateStudent(Long id, com.smartattendance.student.dto.UpdateStudentRequest request, String bearerToken) {
        StudentEntity student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentException("Student record not found for ID: " + id, HttpStatus.NOT_FOUND));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            student.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            student.setPhone(request.getPhone().trim());
        }
        if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            student.setDepartment(request.getDepartment().trim());
        }
        if (request.getCourse() != null && !request.getCourse().isBlank()) {
            student.setCourse(request.getCourse().trim());
        }
        if (request.getYear() != null && !request.getYear().isBlank()) {
            student.setYear(request.getYear().trim());
        }
        if (request.getSection() != null && !request.getSection().isBlank()) {
            student.setSection(request.getSection().trim());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            student.setStatus(request.getStatus().trim().toUpperCase());
        }

        StudentEntity saved = studentRepository.save(student);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            try {
                authServiceClient.updateAuthUser(saved.getEmail(), saved.getFullName(), bearerToken);
            } catch (Exception ignored) {}
        }

        return mapToResponse(saved);
    }

    @Transactional
    public EnrollmentStatusResponse startEnrollment(String email) {
        StudentEntity student = studentRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new StudentException("Student record not found.", HttpStatus.NOT_FOUND));

        if (!"COMPLETED".equals(student.getEnrollmentStatus())) {
            student.setEnrollmentStatus("IN_PROGRESS");
            studentRepository.save(student);
        }

        return getEnrollmentStatus(email);
    }

    @Transactional(readOnly = true)
    public EnrollmentStatusResponse getEnrollmentStatus(String email) {
        StudentEntity student = studentRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new StudentException("Student record not found.", HttpStatus.NOT_FOUND));

        FaceEnrollmentEntity face = faceEnrollmentRepository.findByStudentId(student.getId())
                .orElse(new FaceEnrollmentEntity(student.getId()));

        DeviceEnrollmentEntity device = deviceEnrollmentRepository.findByStudentId(student.getId())
                .orElse(new DeviceEnrollmentEntity(student.getId()));

        boolean isFaceDone = "COMPLETED".equals(face.getStatus());
        boolean isDeviceDone = "COMPLETED".equals(device.getStatus());
        boolean isComplete = isFaceDone && isDeviceDone;

        return new EnrollmentStatusResponse(
                student.getEnrollmentStatus(),
                true, // Personal details confirmed upon faculty creation
                face.getStatus(),
                device.getStatus(),
                isComplete
        );
    }

    @Transactional
    public EnrollmentStatusResponse completeFaceStep(String email, String templateReference) {
        StudentEntity student = studentRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new StudentException("Student record not found.", HttpStatus.NOT_FOUND));

        FaceEnrollmentEntity face = faceEnrollmentRepository.findByStudentId(student.getId())
                .orElseGet(() -> new FaceEnrollmentEntity(student.getId()));

        if (templateReference != null && !templateReference.isBlank()) {
            face.setStatus("COMPLETED");
            face.setTemplateReference(templateReference);
            face.setEnrolledAt(LocalDateTime.now());
            faceEnrollmentRepository.save(face);
        } else {
            face.setStatus("PENDING");
            faceEnrollmentRepository.save(face);
        }

        checkAndCompleteOverallEnrollment(student);
        return getEnrollmentStatus(email);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getStoredFaceTemplate(String email) {
        StudentEntity student = studentRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new StudentException("Student record not found.", HttpStatus.NOT_FOUND));

        var faceOpt = faceEnrollmentRepository.findByStudentId(student.getId());
        if (faceOpt.isEmpty() || !"COMPLETED".equals(faceOpt.get().getStatus()) || faceOpt.get().getTemplateReference() == null || faceOpt.get().getTemplateReference().isBlank()) {
            return java.util.Map.of("enrolled", false, "status", "FACE_ENROLLMENT_REQUIRED");
        }

        return java.util.Map.of(
                "enrolled", true,
                "status", "COMPLETED",
                "templateReference", faceOpt.get().getTemplateReference()
        );
    }

    @Transactional
    public EnrollmentStatusResponse completeDeviceStep(String email, String deviceLabel, String deviceFingerprintHash) {
        StudentEntity student = studentRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new StudentException("Student record not found.", HttpStatus.NOT_FOUND));

        DeviceEnrollmentEntity device = deviceEnrollmentRepository.findByStudentId(student.getId())
                .orElseGet(() -> new DeviceEnrollmentEntity(student.getId()));

        if (deviceFingerprintHash != null && !deviceFingerprintHash.isBlank()) {
            var existingBinding = deviceEnrollmentRepository.findByDeviceFingerprintHash(deviceFingerprintHash);
            if (existingBinding.isPresent() && !existingBinding.get().getStudentId().equals(student.getId())) {
                throw new StudentException("Device is already registered to another student account.", HttpStatus.CONFLICT);
            }

            device.setStatus("COMPLETED");
            device.setDeviceFingerprintHash(deviceFingerprintHash);
            device.setDeviceLabel(deviceLabel != null ? deviceLabel : "Registered Device");
            device.setEnrolledAt(LocalDateTime.now());
            deviceEnrollmentRepository.save(device);
        } else {
            device.setStatus("PENDING");
            deviceEnrollmentRepository.save(device);
        }

        checkAndCompleteOverallEnrollment(student);
        return getEnrollmentStatus(email);
    }

    private void checkAndCompleteOverallEnrollment(StudentEntity student) {
        FaceEnrollmentEntity face = faceEnrollmentRepository.findByStudentId(student.getId()).orElse(null);
        DeviceEnrollmentEntity device = deviceEnrollmentRepository.findByStudentId(student.getId()).orElse(null);

        if (face != null && "COMPLETED".equals(face.getStatus()) &&
            device != null && "COMPLETED".equals(device.getStatus())) {
            student.setEnrollmentStatus("COMPLETED");
            studentRepository.save(student);
        } else {
            if ("PENDING".equals(student.getEnrollmentStatus())) {
                student.setEnrollmentStatus("IN_PROGRESS");
                studentRepository.save(student);
            }
        }
    }

    @Transactional
    public void deleteStudent(Long id, String bearerToken) {
        StudentEntity student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentException("Student record not found for ID: " + id, HttpStatus.NOT_FOUND));

        String email = student.getEmail();
        Long studentId = student.getId();

        // 1. Clean up from attendance_device_db (DEVICE-SERVICE database)
        try {
            jdbcTemplate.update("DELETE FROM attendance_device_db.device_enrollments WHERE LOWER(student_email) = LOWER(?)", email);
        } catch (Exception ignored) {}

        // 2. Clean up device enrollment from attendance_student_db
        try {
            deviceEnrollmentRepository.findByStudentId(studentId).ifPresent(deviceEnrollmentRepository::delete);
        } catch (Exception ignored) {}

        // 3. Clean up face enrollment from attendance_student_db
        try {
            faceEnrollmentRepository.findByStudentId(studentId).ifPresent(faceEnrollmentRepository::delete);
        } catch (Exception ignored) {}

        // 4. Remove student entity profile
        studentRepository.delete(student);

        // 5. Delete auth user record in attendance_auth_db.users
        try {
            authServiceClient.deleteAuthUser(email, bearerToken);
        } catch (Exception ignored) {}
    }

    @Transactional
    public void deactivateStudent(Long id, String bearerToken) {
        deleteStudent(id, bearerToken);
    }

    private StudentResponse mapToResponse(StudentEntity entity) {
        String faceStatus = faceEnrollmentRepository.findByStudentId(entity.getId())
                .map(FaceEnrollmentEntity::getStatus)
                .orElse("PENDING");

        String deviceStatus = deviceEnrollmentRepository.findByStudentId(entity.getId())
                .map(DeviceEnrollmentEntity::getStatus)
                .orElse("PENDING");

        boolean isFaceDone = "COMPLETED".equalsIgnoreCase(faceStatus) || "REGISTERED".equalsIgnoreCase(faceStatus);
        boolean isDeviceDone = "COMPLETED".equalsIgnoreCase(deviceStatus) || "REGISTERED".equalsIgnoreCase(deviceStatus);

        return new StudentResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getStudentId(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getDepartment(),
                entity.getCourse(),
                entity.getYear(),
                entity.getSection(),
                entity.getStatus(),
                entity.getEnrollmentStatus(),
                faceStatus,
                deviceStatus,
                isFaceDone,
                isDeviceDone,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
