package com.planitask.controller;

import com.planitask.dto.request.LoginRequest;
import com.planitask.dto.request.RegisterRequest;
import com.planitask.dto.response.JwtResponse;
import com.planitask.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email requis"));
        }
        return ResponseEntity.ok(authService.forgotPassword(email));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String nouveauMotDePasse = body.get("nouveauMotDePasse");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token requis"));
        }
        if (nouveauMotDePasse == null || nouveauMotDePasse.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mot de passe minimum 6 caractères"));
        }
        authService.resetPassword(token, nouveauMotDePasse);
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
    }
}
