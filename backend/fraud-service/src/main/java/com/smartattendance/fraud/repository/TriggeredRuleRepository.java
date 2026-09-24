package com.smartattendance.fraud.repository;

import com.smartattendance.fraud.entity.TriggeredRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TriggeredRuleRepository extends JpaRepository<TriggeredRuleEntity, Long> {
    List<TriggeredRuleEntity> findByAssessmentId(String assessmentId);
    void deleteByAssessmentId(String assessmentId);
}
