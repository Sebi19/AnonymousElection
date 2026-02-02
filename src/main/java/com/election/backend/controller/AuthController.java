package com.election.backend.controller;

import com.election.backend.dto.UserDto;
import com.election.backend.mapper.UserMapper;
import com.election.backend.model.AppUser;
import com.election.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public AuthController(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
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
}