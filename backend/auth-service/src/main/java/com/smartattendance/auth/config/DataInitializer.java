package com.smartattendance.auth.config;

import com.smartattendance.auth.entity.AccountStatus;
import com.smartattendance.auth.entity.Role;
import com.smartattendance.auth.entity.UserEntity;
import com.smartattendance.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${initial.admin.email:admin@college.edu}")
    private String adminEmail;

    @Value("${initial.admin.password:admin123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByRole(Role.ADMIN)) {
            log.info("No ADMIN account found in database. Initializing initial ADMIN account...");
            UserEntity admin = new UserEntity();
            admin.setEmail(adminEmail.toLowerCase().trim());
            admin.setName("System Administrator");
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setAccountStatus(AccountStatus.ACTIVE);

            userRepository.save(admin);
            log.info("Initial ADMIN account created successfully for email: {}", adminEmail);
        }
    }
}
