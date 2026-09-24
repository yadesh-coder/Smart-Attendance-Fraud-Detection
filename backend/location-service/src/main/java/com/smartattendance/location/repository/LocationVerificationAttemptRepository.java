package com.smartattendance.location.repository;

import com.smartattendance.location.entity.LocationVerificationAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationVerificationAttemptRepository extends JpaRepository<LocationVerificationAttemptEntity, Long> {
    Optional<LocationVerificationAttemptEntity> findByAttemptId(String attemptId);
    List<LocationVerificationAttemptEntity> findByStudentUserId(Long studentUserId);
    List<LocationVerificationAttemptEntity> findBySessionId(String sessionId);
}
