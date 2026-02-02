package com.election.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
@Builder
public class ElectionDto {
    private Long id;
    private String title;
    private String status;
    private List<UserDto> candidates; // Options to choose from
    private List<UserDto> eligibleVoters;
    private Set<Long> userIdsWhoVoted;
}
