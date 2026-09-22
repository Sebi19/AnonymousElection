package com.election.backend.controller;

import com.election.backend.dto.ResetPasswordRequestDto;
import com.election.backend.dto.ResetTokenInfoDto;
import com.election.backend.dto.UserDto;
import com.election.backend.mapper.UserMapper;
import com.election.backend.model.AppUser;
import com.election.backend.model.PasswordResetToken;
import com.election.backend.repository.PasswordResetTokenRepository;
import com.election.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    private final AuthenticationManager authenticationManager;
    private final TokenBasedRememberMeServices rememberMeServices;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(UserRepository userRepository, UserMapper userMapper, PasswordResetTokenRepository resetTokenRepo,
                           PasswordEncoder encoder, AuthenticationManager authenticationManager, TokenBasedRememberMeServices rememberMeServices) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.resetTokenRepo = resetTokenRepo;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.rememberMeServices = rememberMeServices;
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
    // and is immediately logged in, so they don't have to type it again right away
    @PostMapping("/reset-password/{token}")
    public UserDto resetPassword(@PathVariable String token, @RequestBody ResetPasswordRequestDto request,
                                  HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
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

        Authentication authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(user.getUsername(), request.getNewPassword())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        rememberMeServices.loginSuccess(httpRequest, httpResponse, authentication);

        return userMapper.toDto(user);
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