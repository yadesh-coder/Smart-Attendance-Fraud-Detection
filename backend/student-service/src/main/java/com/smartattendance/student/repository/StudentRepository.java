package com.smartattendance.student.repository;

import com.smartattendance.student.entity.StudentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<StudentEntity, Long> {
    Optional<StudentEntity> findByEmailIgnoreCase(String email);
    Optional<StudentEntity> findByStudentIdIgnoreCase(String studentId);
    Optional<StudentEntity> findByUserId(Long userId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByStudentIdIgnoreCase(String studentId);
}
