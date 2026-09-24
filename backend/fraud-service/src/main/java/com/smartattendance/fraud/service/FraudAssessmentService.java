package com.smartattendance.fraud.service;

import com.smartattendance.fraud.dto.EvaluateFraudRequest;
import com.smartattendance.fraud.dto.FraudAssessmentResponse;
import com.smartattendance.fraud.dto.TriggeredRuleDto;
import com.smartattendance.fraud.entity.FraudAssessmentEntity;
import com.smartattendance.fraud.entity.TriggeredRuleEntity;
import com.smartattendance.fraud.exception.FraudException;
import com.smartattendance.fraud.repository.FraudAssessmentRepository;
import com.smartattendance.fraud.repository.TriggeredRuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FraudAssessmentService {

    private final FraudAssessmentRepository assessmentRepository;
    private final TriggeredRuleRepository triggeredRuleRepository;
    private final FraudRuleEngine ruleEngine;

    public FraudAssessmentService(FraudAssessmentRepository assessmentRepository,
                                  TriggeredRuleRepository triggeredRuleRepository,
                                  FraudRuleEngine ruleEngine) {
        this.assessmentRepository = assessmentRepository;
        this.triggeredRuleRepository = triggeredRuleRepository;
        this.ruleEngine = ruleEngine;
    }

    @Transactional
    public FraudAssessmentResponse evaluateFraud(EvaluateFraudRequest request) {
        if (request.getAttemptId() == null || request.getAttemptId().isBlank()) {
            throw new FraudException("Attempt ID is required for fraud evaluation.", HttpStatus.BAD_REQUEST);
        }

        FraudRuleEngine.EvaluationResult evalResult = ruleEngine.evaluate(
                request.getQrStatus(),
                request.getFaceStatus(),
                request.getDeviceStatus(),
                request.getLocationStatus()
        );

        FraudAssessmentEntity entity = assessmentRepository.findByAttemptId(request.getAttemptId())
                .orElseGet(() -> {
                    FraudAssessmentEntity newEntity = new FraudAssessmentEntity();
                    newEntity.setAssessmentId("FRAUD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
                    newEntity.setAttemptId(request.getAttemptId());
                    return newEntity;
                });

        entity.setSessionId(request.getSessionId());
        entity.setStudentUserId(request.getStudentUserId());
        entity.setQrStatus(request.getQrStatus());
        entity.setFaceStatus(request.getFaceStatus());
        entity.setDeviceStatus(request.getDeviceStatus());
        entity.setLocationStatus(request.getLocationStatus());
        entity.setRiskLevel(evalResult.getRiskLevel());
        entity.setDecision(evalResult.getDecision());

        FraudAssessmentEntity saved = assessmentRepository.save(entity);

        // Update triggered rules
        triggeredRuleRepository.deleteByAssessmentId(saved.getAssessmentId());
        List<TriggeredRuleEntity> ruleEntities = evalResult.getTriggeredRules().stream()
                .map(r -> new TriggeredRuleEntity(saved.getAssessmentId(), r.getRuleCode(), r.getRuleDescription(), r.getSeverity()))
                .collect(Collectors.toList());
        triggeredRuleRepository.saveAll(ruleEntities);

        List<TriggeredRuleDto> ruleDtos = evalResult.getTriggeredRules();

        return new FraudAssessmentResponse(
                saved.getAssessmentId(),
                saved.getAttemptId(),
                saved.getSessionId(),
                saved.getStudentUserId(),
                saved.getQrStatus(),
                saved.getFaceStatus(),
                saved.getDeviceStatus(),
                saved.getLocationStatus(),
                saved.getRiskLevel(),
                saved.getDecision(),
                ruleDtos,
                saved.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public FraudAssessmentResponse getAssessmentByAttemptId(String attemptId) {
        FraudAssessmentEntity entity = assessmentRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new FraudException("Fraud assessment not found for attemptId: " + attemptId, HttpStatus.NOT_FOUND));

        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<FraudAssessmentResponse> getAssessmentsByStudentUserId(Long studentUserId) {
        List<FraudAssessmentEntity> entities = assessmentRepository.findByStudentUserId(studentUserId);
        return entities.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FraudAssessmentResponse> getAssessmentsBySessionId(String sessionId) {
        List<FraudAssessmentEntity> entities = assessmentRepository.findBySessionId(sessionId);
        return entities.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private FraudAssessmentResponse mapToResponse(FraudAssessmentEntity entity) {
        List<TriggeredRuleEntity> rules = triggeredRuleRepository.findByAssessmentId(entity.getAssessmentId());
        List<TriggeredRuleDto> ruleDtos = rules.stream()
                .map(r -> new TriggeredRuleDto(r.getRuleCode(), r.getRuleDescription(), r.getSeverity()))
                .collect(Collectors.toList());

        return new FraudAssessmentResponse(
                entity.getAssessmentId(),
                entity.getAttemptId(),
                entity.getSessionId(),
                entity.getStudentUserId(),
                entity.getQrStatus(),
                entity.getFaceStatus(),
                entity.getDeviceStatus(),
                entity.getLocationStatus(),
                entity.getRiskLevel(),
                entity.getDecision(),
                ruleDtos,
                entity.getCreatedAt()
        );
    }
}
