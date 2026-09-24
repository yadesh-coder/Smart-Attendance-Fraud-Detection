package com.smartattendance.student.repository;

import com.smartattendance.student.entity.FaceEnrollmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FaceEnrollmentRepository extends JpaRepository<FaceEnrollmentEntity, Long> {
    Optional<FaceEnrollmentEntity> findByStudentId(Long studentId);
}
