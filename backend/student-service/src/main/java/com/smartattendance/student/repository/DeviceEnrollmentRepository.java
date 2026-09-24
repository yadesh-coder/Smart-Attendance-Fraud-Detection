package com.smartattendance.student.repository;

import com.smartattendance.student.entity.DeviceEnrollmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceEnrollmentRepository extends JpaRepository<DeviceEnrollmentEntity, Long> {
    Optional<DeviceEnrollmentEntity> findByStudentId(Long studentId);
    Optional<DeviceEnrollmentEntity> findByDeviceFingerprintHash(String deviceFingerprintHash);
}
