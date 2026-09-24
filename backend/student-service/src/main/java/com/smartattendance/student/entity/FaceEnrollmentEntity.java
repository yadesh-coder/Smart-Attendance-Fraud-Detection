package com.smartattendance.student.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "face_enrollments")
public class FaceEnrollmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    @Column(name = "model_version", length = 50)
    private String modelVersion = "v1.0";

    @Column(name = "template_reference", length = 255)
    private String templateReference; // Secure reference token, never raw image or embedding data

    @Column(name = "enrolled_at")
    private LocalDateTime enrolledAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public FaceEnrollmentEntity() {
        this.updatedAt = LocalDateTime.now();
    }

    public FaceEnrollmentEntity(Long studentId) {
        this.studentId = studentId;
        this.status = "PENDING";
        this.modelVersion = "v1.0";
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public String getTemplateReference() {
        return templateReference;
    }

    public void setTemplateReference(String templateReference) {
        this.templateReference = templateReference;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
