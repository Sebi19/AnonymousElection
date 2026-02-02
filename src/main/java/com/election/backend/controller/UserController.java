package com.election.backend.controller;

import com.election.backend.dto.ResetPasswordRequestDto;
import com.election.backend.dto.UpdateUserRequestDto;
import com.election.backend.dto.UserDto;
import com.election.backend.mapper.UserMapper;
import com.election.backend.model.AppUser;
import com.election.backend.repository.UserRepository;
import com.election.backend.dto.CreateUserRequestDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repo;
    private final UserMapper userMapper;
    private final PasswordEncoder encoder;

    public UserController(UserRepository repo, UserMapper userMapper, PasswordEncoder encoder) {
        this.repo = repo;
        this.userMapper = userMapper;
        this.encoder = encoder;
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
        // Username should be lowercase
        newUser.setPassword(encoder.encode(request.getPassword())); // Hash it!
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

    // 5. Reset Password
    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequestDto request) {
        AppUser user = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if(user.getUsername().equals("admin")){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot modify default admin user");
        }

        user.setPassword(encoder.encode(request.getNewPassword()));
        repo.save(user);
    }
}