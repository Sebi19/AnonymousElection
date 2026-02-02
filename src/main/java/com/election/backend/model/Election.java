package com.election.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
public class Election {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Enumerated(EnumType.STRING)
    private ElectionStatus status; // OPEN, COMPLETED

    // PASSIVE VOTING RIGHT: Who can be voted FOR (Candidates)
    @ManyToMany
    @JoinTable(name = "election_candidates")
    private Set<AppUser> candidates = new HashSet<>();

    // ACTIVE VOTING RIGHT: Who is ALLOWED to vote
    @ManyToMany
    @JoinTable(name = "election_eligible_voters")
    private Set<AppUser> eligibleVoters = new HashSet<>();

    // TRACKING: Who HAS already voted (To prevent double voting)
    // We store IDs here to keep it simple and separate from the Vote content
    @ElementCollection
    @CollectionTable(name = "election_participation")
    @Column(name = "user_id")
    private Set<Long> userIdsWhoVoted = new HashSet<>();
}