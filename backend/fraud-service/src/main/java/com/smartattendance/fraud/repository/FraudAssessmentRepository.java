package com.smartattendance.fraud.repository;

import com.smartattendance.fraud.entity.FraudAssessmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FraudAssessmentRepository extends JpaRepository<FraudAssessmentEntity, Long> {
    Optional<FraudAssessmentEntity> findByAssessmentId(String assessmentId);
    Optional<FraudAssessmentEntity> findByAttemptId(String attemptId);
    List<FraudAssessmentEntity> findByStudentUserId(Long studentUserId);
    List<FraudAssessmentEntity> findBySessionId(String sessionId);
}
