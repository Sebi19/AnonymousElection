package com.election.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ElectionResultDto {
    private Long candidateId;
    private String candidateName;
    private Long count;
}
