package com.smartattendance.faculty.repository;

import com.smartattendance.faculty.entity.StudentSubjectAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSubjectAssignmentRepository extends JpaRepository<StudentSubjectAssignmentEntity, Long> {
    List<StudentSubjectAssignmentEntity> findBySubjectIdAndStatus(String subjectId, String status);
    List<StudentSubjectAssignmentEntity> findByStudentUserIdAndStatus(Long studentUserId, String status);
    Optional<StudentSubjectAssignmentEntity> findBySubjectIdAndStudentUserId(String subjectId, Long studentUserId);
    boolean existsBySubjectIdAndStudentUserIdAndStatus(String subjectId, Long studentUserId, String status);
    void deleteBySubjectIdAndStudentUserId(String subjectId, Long studentUserId);
    void deleteBySubjectId(String subjectId);
}
