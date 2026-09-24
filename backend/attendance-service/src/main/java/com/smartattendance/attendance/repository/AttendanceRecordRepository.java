package com.smartattendance.attendance.repository;

import com.smartattendance.attendance.entity.AttendanceRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecordEntity, Long> {
    boolean existsBySessionIdAndStudentUserId(String sessionId, Long studentUserId);
    List<AttendanceRecordEntity> findByStudentUserId(Long studentUserId);
    List<AttendanceRecordEntity> findBySessionId(String sessionId);
    Optional<AttendanceRecordEntity> findByVerificationAttemptId(String verificationAttemptId);
    Optional<AttendanceRecordEntity> findBySessionIdAndStudentUserId(String sessionId, Long studentUserId);
    Optional<AttendanceRecordEntity> findTopBySessionIdAndStudentUserIdOrderByIdDesc(String sessionId, Long studentUserId);
}
