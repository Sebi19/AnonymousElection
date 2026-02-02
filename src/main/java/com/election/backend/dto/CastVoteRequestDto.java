package com.election.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CastVoteRequestDto {
    // If null, it is an Abstain
    private Long candidateId;
}
