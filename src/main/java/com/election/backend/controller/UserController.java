package com.election.backend.controller;

import com.election.backend.dto.ChangePasswordRequestDto;
import com.election.backend.dto.PasswordResetLinkDto;
import com.election.backend.dto.UpdateUserRequestDto;
import com.election.backend.dto.UserDto;
import com.election.backend.mapper.UserMapper;
import com.election.backend.model.AppUser;
import com.election.backend.model.PasswordResetToken;
import com.election.backend.repository.PasswordResetTokenRepository;
import com.election.backend.repository.UserRepository;
import com.election.backend.dto.CreateUserRequestDto;
import jakarta.transaction.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final int MIN_PASSWORD_LENGTH = 4;
    private static final Duration RESET_LINK_VALIDITY = Duration.ofHours(24);

    private final UserRepository repo;
    private final UserMapper userMapper;
    private final PasswordEncoder encoder;
    private final PasswordResetTokenRepository resetTokenRepo;

    public UserController(UserRepository repo, UserMapper userMapper, PasswordEncoder encoder, PasswordResetTokenRepository resetTokenRepo) {
        this.repo = repo;
        this.userMapper = userMapper;
        this.encoder = encoder;
        this.resetTokenRepo = resetTokenRepo;
    }

    // 1. List all users (Admin only)
    @GetMapping
    public List<UserDto> getUsers() {
        return repo.findAll().stream()
            .map(userMapper::toDto)
            .toList();
    }

    // 2. Create a new user (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto createUser(@RequestBody CreateUserRequestDto request) {
        if (repo.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        AppUser newUser = userMapper.createRequestToEntity(request);
        // No password is set at creation time; it's unusable until the user sets
        // their own via a password reset link (see generatePasswordResetLink)
        newUser.setPassword(encoder.encode(UUID.randomUUID().toString()));
        // Default to USER if no role provided, or allow Admin to set it

        AppUser savedUser = repo.save(newUser);
        return userMapper.toDto(savedUser);
    }

    // 3. Delete a user (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Return 204 OK on success
    public void deleteUser(@PathVariable Long id) {
        AppUser user = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getUsername().equals("admin")){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete default admin user");
        }
        repo.deleteById(id);
    }

    // 4. Update User Details
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto updateUser(@PathVariable Long id, @RequestBody UpdateUserRequestDto request) {
        AppUser user = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getUsername().equals("admin")){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot modify default admin user");
        }

        // MapStruct updates the fields
        userMapper.updateEntityFromRequest(request, user);

        return userMapper.toDto(repo.save(user));
    }

    // 5. Generate a one-time password reset link for a user (Admin only)
    // The admin shares the resulting link with the user out of band; the user then
    // sets their own new password by following it (see AuthController).
    @PostMapping("/{id}/password-reset-link")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PasswordResetLinkDto generatePasswordResetLink(@PathVariable Long id) {
        AppUser user = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getUsername().equals("admin")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot modify default admin user");
        }

        // Invalidate any previous unused link for this user
        resetTokenRepo.deleteByUserId(id);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(UUID.randomUUID().toString());
        resetToken.setUserId(id);
        resetToken.setExpiresAt(Instant.now().plus(RESET_LINK_VALIDITY));
        resetTokenRepo.save(resetToken);

        return new PasswordResetLinkDto(resetToken.getToken());
    }

    // 6. Change your own password (any logged-in user)
    @PutMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeOwnPassword(@RequestBody ChangePasswordRequestDto request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        AppUser user = repo.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }

        user.setPassword(encoder.encode(request.getNewPassword()));
        repo.save(user);
    }
}