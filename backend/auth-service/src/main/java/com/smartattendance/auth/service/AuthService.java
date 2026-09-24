package com.smartattendance.auth.service;

import com.smartattendance.auth.config.JwtTokenProvider;
import com.smartattendance.auth.dto.ChangePasswordRequest;
import com.smartattendance.auth.dto.CreateUserRequest;
import com.smartattendance.auth.dto.LoginRequest;
import com.smartattendance.auth.dto.LoginResponse;
import com.smartattendance.auth.dto.UserDto;
import com.smartattendance.auth.entity.AccountStatus;
import com.smartattendance.auth.entity.Role;
import com.smartattendance.auth.entity.UserEntity;
import com.smartattendance.auth.exception.AuthException;
import com.smartattendance.auth.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JdbcTemplate jdbcTemplate;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.jdbcTemplate = jdbcTemplate;
    }

    private boolean isSetupCompleteForUser(UserEntity user) {
        if (user.getRole() != Role.STUDENT) {
            return true;
        }
        try {
            String status = jdbcTemplate.queryForObject(
                    "SELECT enrollment_status FROM attendance_student_db.students WHERE LOWER(email) = LOWER(?)",
                    String.class,
                    user.getEmail()
            );
            return "COMPLETED".equalsIgnoreCase(status);
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AuthException("Email is required.", HttpStatus.BAD_REQUEST);
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new AuthException("Password is required.", HttpStatus.BAD_REQUEST);
        }

        String email = request.getEmail().trim().toLowerCase();

        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AuthException("Invalid email or password.", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AuthException("Your account is currently inactive. Please contact administration.", HttpStatus.FORBIDDEN);
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        boolean isSetupComplete = isSetupCompleteForUser(user);
        String department = getUserDepartment(user);

        UserDto userDto = new UserDto(
                String.valueOf(user.getId()),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                department,
                isSetupComplete,
                user.isMustChangePassword()
        );

        return new LoginResponse(
                String.valueOf(user.getId()),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                token,
                userDto,
                user.isMustChangePassword()
        );
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        if (email == null || email.isBlank()) {
            throw new AuthException("Unauthenticated user context.", HttpStatus.UNAUTHORIZED);
        }

        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AuthException("User account not found.", HttpStatus.NOT_FOUND));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AuthException("User account is inactive.", HttpStatus.FORBIDDEN);
        }

        boolean isSetupComplete = isSetupCompleteForUser(user);
        String department = getUserDepartment(user);

        return new UserDto(
                String.valueOf(user.getId()),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                department,
                isSetupComplete,
                user.isMustChangePassword()
        );
    }

    private String getUserDepartment(UserEntity user) {
        if (user == null || user.getRole() == Role.ADMIN) {
            return null;
        }
        try {
            if (user.getRole() == Role.FACULTY) {
                return jdbcTemplate.queryForObject(
                        "SELECT department FROM attendance_faculty_db.faculty WHERE LOWER(email) = LOWER(?)",
                        String.class,
                        user.getEmail()
                );
            } else if (user.getRole() == Role.STUDENT) {
                return jdbcTemplate.queryForObject(
                        "SELECT department FROM attendance_student_db.students WHERE LOWER(email) = LOWER(?)",
                        String.class,
                        user.getEmail()
                );
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    @Transactional
    public UserDto createUserByAdmin(CreateUserRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AuthException("Email is required.", HttpStatus.BAD_REQUEST);
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new AuthException("Password is required.", HttpStatus.BAD_REQUEST);
        }

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new AuthException("An account with this email already exists.", HttpStatus.CONFLICT);
        }

        Role assignedRole = request.getRole() != null ? request.getRole() : Role.FACULTY;

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setName(request.getName() != null ? request.getName() : "User");
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(assignedRole);
        user.setAccountStatus(AccountStatus.ACTIVE);
        // Provisioned accounts with initial passwords must change password on first login
        user.setMustChangePassword(true);

        UserEntity saved = userRepository.save(user);
        String department = getUserDepartment(saved);

        return new UserDto(
                String.valueOf(saved.getId()),
                saved.getEmail(),
                saved.getName(),
                saved.getRole(),
                department,
                true,
                saved.isMustChangePassword()
        );
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (email == null || email.isBlank()) {
            throw new AuthException("Unauthenticated user context.", HttpStatus.UNAUTHORIZED);
        }

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new AuthException("Current password is required.", HttpStatus.BAD_REQUEST);
        }

        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new AuthException("New password is required.", HttpStatus.BAD_REQUEST);
        }

        UserEntity user = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase())
                .orElseThrow(() -> new AuthException("User account not found.", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AuthException("Incorrect current password.", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    @Transactional
    public void deactivateUser(String email) {
        if (email == null || email.isBlank()) return;
        userRepository.findByEmailIgnoreCase(email.trim().toLowerCase()).ifPresent(user -> {
            user.setAccountStatus(AccountStatus.INACTIVE);
            userRepository.save(user);
        });
    }

    @Transactional
    public void deleteUserByEmail(String email) {
        if (email == null || email.isBlank()) return;
        userRepository.findByEmailIgnoreCase(email.trim().toLowerCase()).ifPresent(userRepository::delete);
    }

    @Transactional
    public void updateUserProfile(String email, String name) {
        if (email == null || email.isBlank() || name == null || name.isBlank()) return;
        userRepository.findByEmailIgnoreCase(email.trim().toLowerCase()).ifPresent(user -> {
            user.setName(name.trim());
            userRepository.save(user);
        });
    }
}
