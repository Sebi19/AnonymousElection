package com.election.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateUserRequestDto {
    private String username;
    private String firstName;
    private String lastName;
    private String role;
}
