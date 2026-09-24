package com.smartattendance.auth.repository;

import com.smartattendance.auth.entity.Role;
import com.smartattendance.auth.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    boolean existsByRole(Role role);
    boolean existsByEmailIgnoreCase(String email);
}
