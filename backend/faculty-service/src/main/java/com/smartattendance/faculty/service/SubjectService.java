package com.smartattendance.faculty.service;

import com.smartattendance.faculty.dto.CreateSubjectRequest;
import com.smartattendance.faculty.dto.SubjectResponse;
import com.smartattendance.faculty.entity.FacultyEntity;
import com.smartattendance.faculty.entity.SubjectEntity;
import com.smartattendance.faculty.exception.FacultyException;
import com.smartattendance.faculty.repository.FacultyRepository;
import com.smartattendance.faculty.repository.SubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final FacultyRepository facultyRepository;
    private final com.smartattendance.faculty.repository.StudentSubjectAssignmentRepository assignmentRepository;

    public SubjectService(SubjectRepository subjectRepository,
                          FacultyRepository facultyRepository,
                          com.smartattendance.faculty.repository.StudentSubjectAssignmentRepository assignmentRepository) {
        this.subjectRepository = subjectRepository;
        this.facultyRepository = facultyRepository;
        this.assignmentRepository = assignmentRepository;
    }

    private void verifyActiveFaculty(Long facultyUserId) {
        FacultyEntity faculty = facultyRepository.findByUserId(facultyUserId)
                .orElseThrow(() -> new FacultyException("Faculty account record not found.", HttpStatus.FORBIDDEN));
        if (!"ACTIVE".equalsIgnoreCase(faculty.getStatus())) {
            throw new FacultyException("Your faculty account is currently inactive.", HttpStatus.FORBIDDEN);
        }
    }

    @Transactional
    public SubjectResponse createSubject(CreateSubjectRequest request, Long facultyUserId) {
        verifyActiveFaculty(facultyUserId);

        if (request.getSubjectCode() == null || request.getSubjectCode().isBlank()) {
            throw new FacultyException("Subject code is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getSubjectName() == null || request.getSubjectName().isBlank()) {
            throw new FacultyException("Subject name is required.", HttpStatus.BAD_REQUEST);
        }

        String subjectCode = request.getSubjectCode().trim().toUpperCase();
        String subjectId = "SUBJ_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        SubjectEntity entity = new SubjectEntity(
                subjectId,
                subjectCode,
                request.getSubjectName().trim(),
                request.getDepartment() != null ? request.getDepartment().trim() : "Computer Science & Engineering",
                request.getCourse() != null ? request.getCourse().trim() : "B.Tech",
                request.getAcademicYear() != null ? request.getAcademicYear().trim() : "2025-2026",
                request.getSemester() != null ? request.getSemester().trim() : "1",
                request.getSection() != null ? request.getSection().trim() : "A",
                facultyUserId
        );

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            entity.setStatus(request.getStatus().toUpperCase());
        }

        SubjectEntity saved = subjectRepository.save(entity);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SubjectResponse> getFacultySubjects(Long facultyUserId) {
        verifyActiveFaculty(facultyUserId);
        return subjectRepository.findByFacultyUserIdAndStatus(facultyUserId, "ACTIVE").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(Long id, Long facultyUserId) {
        verifyActiveFaculty(facultyUserId);
        SubjectEntity entity = subjectRepository.findById(id)
                .orElseThrow(() -> new FacultyException("Subject not found for ID: " + id, HttpStatus.NOT_FOUND));

        if (!entity.getFacultyUserId().equals(facultyUserId)) {
            throw new FacultyException("Access denied: You do not own this subject.", HttpStatus.FORBIDDEN);
        }

        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    public SubjectResponse getSubjectBySubjectId(String subjectId) {
        SubjectEntity entity = subjectRepository.findBySubjectId(subjectId)
                .or(() -> subjectRepository.findBySubjectCode(subjectId))
                .orElseThrow(() -> new FacultyException("Subject not found for subjectId: " + subjectId, HttpStatus.NOT_FOUND));
        return mapToResponse(entity);
    }

    @Transactional
    public SubjectResponse updateSubject(Long id, CreateSubjectRequest request, Long facultyUserId) {
        verifyActiveFaculty(facultyUserId);
        SubjectEntity entity = subjectRepository.findById(id)
                .orElseThrow(() -> new FacultyException("Subject not found for ID: " + id, HttpStatus.NOT_FOUND));

        if (!entity.getFacultyUserId().equals(facultyUserId)) {
            throw new FacultyException("Access denied: You do not own this subject.", HttpStatus.FORBIDDEN);
        }

        if (request.getSubjectCode() != null && !request.getSubjectCode().isBlank()) {
            entity.setSubjectCode(request.getSubjectCode().trim().toUpperCase());
        }
        if (request.getSubjectName() != null && !request.getSubjectName().isBlank()) {
            entity.setSubjectName(request.getSubjectName().trim());
        }
        if (request.getDepartment() != null) {
            entity.setDepartment(request.getDepartment().trim());
        }
        if (request.getCourse() != null) {
            entity.setCourse(request.getCourse().trim());
        }
        if (request.getAcademicYear() != null) {
            entity.setAcademicYear(request.getAcademicYear().trim());
        }
        if (request.getSemester() != null) {
            entity.setSemester(request.getSemester().trim());
        }
        if (request.getSection() != null) {
            entity.setSection(request.getSection().trim());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            entity.setStatus(request.getStatus().toUpperCase());
        }

        SubjectEntity updated = subjectRepository.save(entity);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteSubject(Long id, Long facultyUserId) {
        deleteSubject(String.valueOf(id), facultyUserId);
    }

    @Transactional
    public void deleteSubject(String idOrSubjectId, Long facultyUserId) {
        verifyActiveFaculty(facultyUserId);
        SubjectEntity entity = subjectRepository.findBySubjectId(idOrSubjectId)
                .or(() -> {
                    try {
                        return subjectRepository.findById(Long.parseLong(idOrSubjectId));
                    } catch (Exception e) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> new FacultyException("Subject not found for ID: " + idOrSubjectId, HttpStatus.NOT_FOUND));

        if (!entity.getFacultyUserId().equals(facultyUserId)) {
            throw new FacultyException("Access denied: You do not own this subject.", HttpStatus.FORBIDDEN);
        }

        entity.setStatus("INACTIVE");
        subjectRepository.save(entity);
    }

    @Transactional
    public List<Long> assignStudentsToSubject(String subjectId, List<Long> studentUserIds, Long facultyUserId) {
        verifyActiveFaculty(facultyUserId);
        SubjectEntity subject = subjectRepository.findBySubjectId(subjectId)
                .orElseThrow(() -> new FacultyException("Subject not found for subjectId: " + subjectId, HttpStatus.NOT_FOUND));

        if (!subject.getFacultyUserId().equals(facultyUserId)) {
            throw new FacultyException("Access denied: You do not own this subject.", HttpStatus.FORBIDDEN);
        }

        if (studentUserIds == null || studentUserIds.isEmpty()) {
            return List.of();
        }

        for (Long studentUserId : studentUserIds) {
            if (studentUserId != null) {
                var existing = assignmentRepository.findBySubjectIdAndStudentUserId(subjectId, studentUserId);
                if (existing.isPresent()) {
                    var entity = existing.get();
                    entity.setStatus("ACTIVE");
                    assignmentRepository.save(entity);
                } else {
                    assignmentRepository.save(new com.smartattendance.faculty.entity.StudentSubjectAssignmentEntity(subjectId, studentUserId));
                }
            }
        }

        return getAssignedStudentUserIds(subjectId);
    }

    @Transactional
    public void removeStudentFromSubject(String subjectId, Long studentUserId, Long facultyUserId) {
        verifyActiveFaculty(facultyUserId);
        SubjectEntity subject = subjectRepository.findBySubjectId(subjectId)
                .orElseThrow(() -> new FacultyException("Subject not found for subjectId: " + subjectId, HttpStatus.NOT_FOUND));

        if (!subject.getFacultyUserId().equals(facultyUserId)) {
            throw new FacultyException("Access denied: You do not own this subject.", HttpStatus.FORBIDDEN);
        }

        assignmentRepository.findBySubjectIdAndStudentUserId(subjectId, studentUserId).ifPresent(assignment -> {
            assignment.setStatus("INACTIVE");
            assignmentRepository.save(assignment);
        });
    }

    @Transactional(readOnly = true)
    public List<Long> getAssignedStudentUserIds(String subjectId) {
        return assignmentRepository.findBySubjectIdAndStatus(subjectId, "ACTIVE").stream()
                .map(com.smartattendance.faculty.entity.StudentSubjectAssignmentEntity::getStudentUserId)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isStudentAssignedToSubject(String subjectId, Long studentUserId) {
        return assignmentRepository.existsBySubjectIdAndStudentUserIdAndStatus(subjectId, studentUserId, "ACTIVE");
    }

    private SubjectResponse mapToResponse(SubjectEntity entity) {
        return new SubjectResponse(
                entity.getId(),
                entity.getSubjectId(),
                entity.getSubjectCode(),
                entity.getSubjectName(),
                entity.getDepartment(),
                entity.getCourse(),
                entity.getAcademicYear(),
                entity.getSemester(),
                entity.getSection(),
                entity.getFacultyUserId(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
