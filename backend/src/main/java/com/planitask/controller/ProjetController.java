package com.planitask.controller;

import com.planitask.dto.request.ProjetRequest;
import com.planitask.dto.response.ProjetResponse;
import com.planitask.entity.Utilisateur;
import com.planitask.service.ProjetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projets")
@RequiredArgsConstructor
public class ProjetController {

    private final ProjetService projetService;

    @GetMapping
    public ResponseEntity<List<ProjetResponse>> getMesProjets(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(projetService.getProjetsUtilisateur(utilisateur));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjetResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(projetService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ProjetResponse> creer(
            @Valid @RequestBody ProjetRequest request,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.creer(request, utilisateur));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjetResponse> mettreAJour(
            @PathVariable Long id,
            @Valid @RequestBody ProjetRequest request,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(projetService.mettreAJour(id, request, utilisateur));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        projetService.supprimer(id, utilisateur);
        return ResponseEntity.noContent().build();
    }
}
