package com.election.backend.config;

import com.election.backend.model.AppUser;
import com.election.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public DatabaseLoader(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (repo.findByUsername("admin").isEmpty()) {
            AppUser admin = new AppUser();
            admin.setUsername("admin");
            // We MUST hash the password before saving
            admin.setPassword(encoder.encode("rsuDbIBigjfUiceR"));
            admin.setRole("ROLE_ADMIN");

            repo.save(admin);
            System.out.println("Default admin user created!");
        }
    }
}