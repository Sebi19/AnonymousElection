package com.election.backend.repository;

import com.election.backend.dto.ElectionResultDto;
import com.election.backend.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    @Query("SELECT new com.election.backend.dto.ElectionResultDto(" +
        "c.id, " +
        // 1. Logic for the Name:
        // If candidate is null -> 'Abstain'
        // Else -> Combine First and Last name
        "CASE WHEN c.id IS NULL THEN 'Abstain' " +
        "     ELSE CONCAT(COALESCE(c.firstName, ''), ' ', COALESCE(c.lastName, '')) END, " +
        "COUNT(v)) " +
        "FROM Vote v " +
        "LEFT JOIN v.candidate c " + // Keep abstentions (null candidates)
        "WHERE v.election.id = :electionId " +
        // 2. Group By ALL selected columns to keep Postgres happy:
        "GROUP BY c.id, c.firstName, c.lastName")
    List<ElectionResultDto> countVotesByElection(@Param("electionId") Long electionId);

    void deleteByElectionId(Long electionId);
}
