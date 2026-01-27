package com.election.backend.controller;

import com.election.backend.dto.CastVoteRequestDto;
import com.election.backend.dto.CreateElectionRequestDto;
import com.election.backend.dto.ElectionDto;
import com.election.backend.dto.ElectionResultDto;
import com.election.backend.mapper.UserMapper;
import com.election.backend.model.AppUser;
import com.election.backend.model.Election;
import com.election.backend.model.ElectionStatus;
import com.election.backend.model.Vote;
import com.election.backend.repository.ElectionRepository;
import com.election.backend.repository.UserRepository;
import com.election.backend.repository.VoteRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

@RestController
@RequestMapping("/api/elections")
public class ElectionController {

    private final UserRepository userRepo;
    private final ElectionRepository electionRepo;
    private final VoteRepository voteRepo;
    private final UserMapper userMapper;

    public ElectionController(UserRepository userRepo, ElectionRepository electionRepo, VoteRepository voteRepo, UserMapper userMapper) {
        this.userRepo = userRepo;
        this.electionRepo = electionRepo;
        this.voteRepo = voteRepo;
        this.userMapper = userMapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ElectionDto createElection(@RequestBody CreateElectionRequestDto request) {
        Election election = new Election();
        election.setTitle(request.getTitle());
        election.setStatus(ElectionStatus.OPEN);

        // Fetch Users from DB based on IDs sent
        List<AppUser> candidates = userRepo.findAllById(request.getCandidateIds());
        List<AppUser> voters = userRepo.findAllById(request.getEligibleVoterIds());

        election.setCandidates(new HashSet<>(candidates));
        election.setEligibleVoters(new HashSet<>(voters));

        Election saved = electionRepo.save(election);
        return mapToDto(saved); // No user context needed for create response
    }

    @GetMapping("/{id}")
    public ElectionDto getElection(@PathVariable Long id) {

        return electionRepo.findById(id)
            .map(this::mapToDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    // 2. GET ALL ELECTIONS
    // Visible to everyone, but we flag if the current user has voted
    @GetMapping
    public List<ElectionDto> getElections() {
        return electionRepo.findAll().stream()
            .map(this::mapToDto)
            .toList();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional // Crucial: Ensures both deletes happen or neither
    public void deleteElection(@PathVariable Long id) {
        if (!electionRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Election not found");
        }

        // 1. Clean up the votes first (to avoid Foreign Key constraint error)
        voteRepo.deleteByElectionId(id);

        // 2. Now safe to delete the election
        electionRepo.deleteById(id);
    }

    // 3. GET RESULTS
    // Only allows access if the election is COMPLETED
    @GetMapping("/{id}/results")
    public List<ElectionResultDto> getResults(@PathVariable Long id) {
        Election election = electionRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (election.getStatus() != ElectionStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Election is still open. Results are hidden.");
        }

        return voteRepo.countVotesByElection(id);
    }

    @PostMapping("/{id}/vote")
    @Transactional // Critical: All or nothing
    public void castVote(@PathVariable Long id, @RequestBody CastVoteRequestDto request) {
        // 1. Identify User
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        AppUser currentUser = userRepo.findByUsernameIgnoreCase(username).orElseThrow();

        // 2. Load Election
        Election election = electionRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // 3. Validation Checks
        if (election.getStatus() != ElectionStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Election is closed");
        }
        if (!election.getEligibleVoters().contains(currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not eligible to vote");
        }
        if (election.getUserIdsWhoVoted().contains(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already voted");
        }

        // 4. Record Participation (The "Check mark" on the list)
        election.getUserIdsWhoVoted().add(currentUser.getId());

        // 5. Create the Anonymous Vote (The "Ballot in the box")
        Vote vote = new Vote();
        vote.setElection(election);

        if (request.getCandidateId() != null) {
            AppUser candidate = userRepo.findById(request.getCandidateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid candidate"));

            // Ensure candidate is actually running in this election
            if (!election.getCandidates().contains(candidate)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a candidate");
            }
            vote.setCandidate(candidate);
        }
        // else: candidate remains null -> Abstain

        voteRepo.save(vote);
        electionRepo.save(election);
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void closeElection(@PathVariable Long id) {
        Election election = electionRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        election.setStatus(ElectionStatus.COMPLETED);
        electionRepo.save(election);
    }

    private ElectionDto mapToDto(Election election) {
        return ElectionDto.builder()
            .id(election.getId())
            .title(election.getTitle())
            .status(election.getStatus().name())
            .candidates(election.getCandidates().stream()
                .map(userMapper::toDto)
                .toList())
            .eligibleVoters(election.getEligibleVoters().stream()
                .map(userMapper::toDto)
                .toList())
            .userIdsWhoVoted(election.getUserIdsWhoVoted())
            .build();
    }
}
