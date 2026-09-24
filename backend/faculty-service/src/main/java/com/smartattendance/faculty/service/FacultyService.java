package com.smartattendance.faculty.service;

import com.smartattendance.faculty.dto.CreateFacultyRequest;
import com.smartattendance.faculty.dto.FacultyResponse;
import com.smartattendance.faculty.dto.UpdateFacultyRequest;
import com.smartattendance.faculty.entity.FacultyEntity;
import com.smartattendance.faculty.entity.SubjectEntity;
import com.smartattendance.faculty.exception.FacultyException;
import com.smartattendance.faculty.repository.FacultyRepository;
import com.smartattendance.faculty.repository.StudentSubjectAssignmentRepository;
import com.smartattendance.faculty.repository.SubjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyService {

    private static final Logger log = LoggerFactory.getLogger(FacultyService.class);

    private final FacultyRepository facultyRepository;
    private final SubjectRepository subjectRepository;
    private final StudentSubjectAssignmentRepository studentSubjectAssignmentRepository;
    private final AuthServiceClient authServiceClient;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public FacultyService(FacultyRepository facultyRepository,
                          SubjectRepository subjectRepository,
                          StudentSubjectAssignmentRepository studentSubjectAssignmentRepository,
                          AuthServiceClient authServiceClient,
                          org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.facultyRepository = facultyRepository;
        this.subjectRepository = subjectRepository;
        this.studentSubjectAssignmentRepository = studentSubjectAssignmentRepository;
        this.authServiceClient = authServiceClient;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public FacultyResponse createFaculty(CreateFacultyRequest request, String bearerToken) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new FacultyException("Email is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getEmployeeId() == null || request.getEmployeeId().isBlank()) {
            throw new FacultyException("Employee ID is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new FacultyException("Full name is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new FacultyException("Initial password is required.", HttpStatus.BAD_REQUEST);
        }

        String email = request.getEmail().trim().toLowerCase();
        String employeeId = request.getEmployeeId().trim().toUpperCase();

        log.info("[FACULTY CREATION TRACE] source=API_ENDPOINT caller=AdminFacultyController endpoint=POST /api/admin/faculty timestamp={} employeeId={} email={}",
                 java.time.LocalDateTime.now(), employeeId, email);

        if (facultyRepository.existsByEmailIgnoreCase(email)) {
            throw new FacultyException("A faculty with this email already exists.", HttpStatus.CONFLICT);
        }
        if (facultyRepository.existsByEmployeeIdIgnoreCase(employeeId)) {
            throw new FacultyException("A faculty with this employee ID already exists.", HttpStatus.CONFLICT);
        }

        // 1. Create auth account in Auth Service via HTTP
        Long userId = authServiceClient.createAuthUser(email, request.getPassword(), request.getFullName(), bearerToken);

        // 2. Create Faculty entity record with compensating rollback if profile save fails
        try {
            FacultyEntity entity = new FacultyEntity(
                    userId,
                    employeeId,
                    request.getFullName(),
                    email,
                    request.getPhone(),
                    request.getDepartment() != null ? request.getDepartment() : "Computer Science & Engineering",
                    request.getDesignation() != null ? request.getDesignation() : "Assistant Professor",
                    "ACTIVE"
            );

            FacultyEntity saved = facultyRepository.save(entity);
            return mapToResponse(saved);
        } catch (Exception ex) {
            try {
                authServiceClient.deactivateAuthUser(email, bearerToken);
            } catch (Exception ignored) {}
            throw new FacultyException("Failed to save faculty profile: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public List<FacultyResponse> getAllFaculty() {
        return facultyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FacultyResponse getFacultyById(Long id) {
        FacultyEntity entity = facultyRepository.findById(id)
                .orElseThrow(() -> new FacultyException("Faculty record not found for ID: " + id, HttpStatus.NOT_FOUND));
        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    public FacultyResponse getFacultyProfile(String email) {
        FacultyEntity entity = facultyRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new FacultyException("Faculty profile not found for email: " + email, HttpStatus.NOT_FOUND));
        return mapToResponse(entity);
    }

    @Transactional
    public FacultyResponse updateFaculty(Long id, UpdateFacultyRequest request) {
        FacultyEntity entity = facultyRepository.findById(id)
                .orElseThrow(() -> new FacultyException("Faculty record not found for ID: " + id, HttpStatus.NOT_FOUND));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            entity.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            entity.setPhone(request.getPhone());
        }
        if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            entity.setDepartment(request.getDepartment());
        }
        if (request.getDesignation() != null && !request.getDesignation().isBlank()) {
            entity.setDesignation(request.getDesignation());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            entity.setStatus(request.getStatus().toUpperCase());
        }

        FacultyEntity updated = facultyRepository.save(entity);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            try {
                authServiceClient.updateAuthUser(updated.getEmail(), updated.getFullName(), null);
            } catch (Exception ignored) {}
        }

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteFaculty(Long id, String bearerToken) {
        FacultyEntity entity = facultyRepository.findById(id)
                .orElseThrow(() -> new FacultyException("Faculty record not found for ID: " + id, HttpStatus.NOT_FOUND));

        String email = entity.getEmail();
        Long facultyUserId = entity.getUserId();

        // 1. Find all subjects owned by this faculty
        List<SubjectEntity> subjects = subjectRepository.findByFacultyUserId(facultyUserId);
        for (SubjectEntity s : subjects) {
            String subjectId = s.getSubjectId();

            // a. Delete student-subject assignments for this subject
            try {
                studentSubjectAssignmentRepository.deleteBySubjectId(subjectId);
            } catch (Exception ex) {
                log.warn("Failed to delete assignments for subjectId {}: {}", subjectId, ex.getMessage());
            }

            // b. Clean up attendance sessions and records for this subject/faculty in attendance_db
            try {
                jdbcTemplate.update("DELETE FROM attendance_db.attendance_records WHERE session_id IN (SELECT session_id FROM attendance_db.attendance_sessions WHERE subject_id = ? OR faculty_user_id = ?)", subjectId, facultyUserId);
                jdbcTemplate.update("DELETE FROM attendance_db.attendance_verification_attempts WHERE session_id IN (SELECT session_id FROM attendance_db.attendance_sessions WHERE subject_id = ? OR faculty_user_id = ?)", subjectId, facultyUserId);
                jdbcTemplate.update("DELETE FROM attendance_db.attendance_sessions WHERE subject_id = ? OR faculty_user_id = ?", subjectId, facultyUserId);
            } catch (Exception ex) {
                log.warn("Failed to clean up attendance sessions for subjectId {}: {}", subjectId, ex.getMessage());
            }

            // c. Delete the subject entity
            subjectRepository.delete(s);
        }

        // 2. Clean up any remaining sessions in attendance_db associated with facultyUserId
        try {
            jdbcTemplate.update("DELETE FROM attendance_db.attendance_records WHERE session_id IN (SELECT session_id FROM attendance_db.attendance_sessions WHERE faculty_user_id = ?)", facultyUserId);
            jdbcTemplate.update("DELETE FROM attendance_db.attendance_verification_attempts WHERE session_id IN (SELECT session_id FROM attendance_db.attendance_sessions WHERE faculty_user_id = ?)", facultyUserId);
            jdbcTemplate.update("DELETE FROM attendance_db.attendance_sessions WHERE faculty_user_id = ?", facultyUserId);
        } catch (Exception ignored) {}

        // 3. Delete faculty profile entity from attendance_faculty_db.faculty
        facultyRepository.delete(entity);

        // 4. Delete Auth user record from attendance_auth_db.users
        try {
            authServiceClient.deleteAuthUser(email, bearerToken);
        } catch (Exception ex) {
            log.error("Failed to delete auth user for email {}: {}", email, ex.getMessage());
        }
    }

    private FacultyResponse mapToResponse(FacultyEntity entity) {
        return new FacultyResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getEmployeeId(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getDepartment(),
                entity.getDesignation(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
