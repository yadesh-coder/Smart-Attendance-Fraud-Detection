package com.smartattendance.device.repository;

import com.smartattendance.device.entity.DeviceEnrollmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeviceEnrollmentRepository extends JpaRepository<DeviceEnrollmentEntity, Long> {

    Optional<DeviceEnrollmentEntity> findByStudentEmailIgnoreCase(String studentEmail);

    Optional<DeviceEnrollmentEntity> findByDeviceFingerprintHash(String deviceFingerprintHash);
}
