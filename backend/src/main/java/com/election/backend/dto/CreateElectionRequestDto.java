package com.election.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
public class CreateElectionRequestDto {
    private String title;
    private Set<Long> candidateIds;      // Who can be elected
    private Set<Long> eligibleVoterIds;  // Who can vote
}
