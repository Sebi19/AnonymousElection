package com.election.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserRequestDto {
    @NotNull
    String username;
    @NotNull
    String password;
    @NotNull
    String role;

    String firstName;
    String lastName;
}
