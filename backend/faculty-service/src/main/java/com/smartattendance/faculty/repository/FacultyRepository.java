package com.smartattendance.faculty.repository;

import com.smartattendance.faculty.entity.FacultyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<FacultyEntity, Long> {
    Optional<FacultyEntity> findByEmailIgnoreCase(String email);
    Optional<FacultyEntity> findByUserId(Long userId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmployeeIdIgnoreCase(String employeeId);
}
