package com.election.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class Vote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Election election;

    // The candidate chosen. If NULL, it counts as "Abstain" (Enthaltung)
    @ManyToOne
    private AppUser candidate;
}