package com.election.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChangePasswordRequestDto {
    private String currentPassword;
    private String newPassword;
}
