package com.election.backend.controller;

import com.election.backend.dto.ResetPasswordRequestDto;
import com.election.backend.dto.ResetTokenInfoDto;
import com.election.backend.dto.UserDto;
import com.election.backend.mapper.UserMapper;
import com.election.backend.model.AppUser;
import com.election.backend.model.PasswordResetToken;
import com.election.backend.repository.PasswordResetTokenRepository;
import com.election.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final int MIN_PASSWORD_LENGTH = 4;

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final PasswordEncoder encoder;

    public AuthController(UserRepository userRepository, UserMapper userMapper, PasswordResetTokenRepository resetTokenRepo, PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.resetTokenRepo = resetTokenRepo;
        this.encoder = encoder;
    }

    // This endpoint works for ANY logged-in user (Admin OR User)
    @GetMapping("/me")
    public UserDto getCurrentUser() {
        // Spring Security injects the logged-in principal here
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Find the full user details from the database based on the authenticated name
        return userRepository.findByUsername(auth.getName())
            .map(userMapper::toDto)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Lets the reset-password page show whose account is being reset,
    // before the user commits to typing a new password
    @GetMapping("/reset-password/{token}")
    public ResetTokenInfoDto getResetTokenInfo(@PathVariable String token) {
        PasswordResetToken resetToken = findValidToken(token);
        AppUser user = userRepository.findById(resetToken.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new ResetTokenInfoDto(user.getUsername());
    }

    // Consumes a one-time password reset link: the user sets their own new password
    @PostMapping("/reset-password/{token}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable String token, @RequestBody ResetPasswordRequestDto request) {
        PasswordResetToken resetToken = findValidToken(token);

        if (request.getNewPassword() == null || request.getNewPassword().length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }

        AppUser user = userRepository.findById(resetToken.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // One-time use
        resetTokenRepo.delete(resetToken);
    }

    private PasswordResetToken findValidToken(String token) {
        PasswordResetToken resetToken = resetTokenRepo.findByToken(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid or expired link"));

        if (resetToken.isExpired()) {
            resetTokenRepo.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.GONE, "This link has expired");
        }

        return resetToken;
    }
}