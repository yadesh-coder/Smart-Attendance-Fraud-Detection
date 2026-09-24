package com.smartattendance.attendance.repository;

import com.smartattendance.attendance.entity.AttendanceSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSessionEntity, Long> {
    Optional<AttendanceSessionEntity> findBySessionId(String sessionId);
    Optional<AttendanceSessionEntity> findByAttendanceCode(String attendanceCode);
    List<AttendanceSessionEntity> findByFacultyUserId(Long facultyUserId);
    List<AttendanceSessionEntity> findByStatus(String status);
    List<AttendanceSessionEntity> findByStatusIn(List<String> statuses);
    List<AttendanceSessionEntity> findByFacultyUserIdAndSubjectIdAndSessionDateAndStartTimeAndEndTimeAndStatusIn(
            Long facultyUserId, String subjectId, String sessionDate, String startTime, String endTime, List<String> statuses);
}
