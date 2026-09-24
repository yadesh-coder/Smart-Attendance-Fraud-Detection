package com.smartattendance.attendance.repository;

import com.smartattendance.attendance.entity.AttendanceVerificationAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttendanceVerificationAttemptRepository extends JpaRepository<AttendanceVerificationAttemptEntity, Long> {
    Optional<AttendanceVerificationAttemptEntity> findByAttemptId(String attemptId);
    Optional<AttendanceVerificationAttemptEntity> findTopBySessionIdAndStudentUserIdOrderByIdDesc(String sessionId, Long studentUserId);
    Optional<AttendanceVerificationAttemptEntity> findBySessionIdAndStudentUserId(String sessionId, Long studentUserId);
}
