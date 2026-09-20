package com.election.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/whatsapp/webhook")
public class WhatsAppWebhookController {

    // Define this token in your application.properties or environment variables
    @Value("${whatsapp.verify-token}")
    private String verifyToken;

    /**
     * Handles the one-time verification handshake from Meta
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
        @RequestParam(name = "hub.mode", required = false) String mode,
        @RequestParam(name = "hub.verify_token", required = false) String token,
        @RequestParam(name = "hub.challenge", required = false) String challenge) {

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            // Must return the challenge string as a raw string, not JSON
            return ResponseEntity.ok(challenge);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
    }

    /**
     * Receives incoming messages and status updates
     */
    @PostMapping
    public ResponseEntity<String> receiveEvent(@RequestBody String payload) {
        // Log or parse the incoming JSON payload here
        System.out.println("Received WhatsApp Event: " + payload);

        // Acknowledge receipt within 5 seconds to prevent Meta from retrying
        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}