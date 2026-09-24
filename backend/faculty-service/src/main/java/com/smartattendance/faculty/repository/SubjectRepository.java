package com.smartattendance.faculty.repository;

import com.smartattendance.faculty.entity.SubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<SubjectEntity, Long> {
    List<SubjectEntity> findByFacultyUserId(Long facultyUserId);
    List<SubjectEntity> findByFacultyUserIdAndStatus(Long facultyUserId, String status);
    Optional<SubjectEntity> findBySubjectId(String subjectId);
    Optional<SubjectEntity> findBySubjectCode(String subjectCode);
    Optional<SubjectEntity> findBySubjectCodeAndFacultyUserId(String subjectCode, Long facultyUserId);
}
