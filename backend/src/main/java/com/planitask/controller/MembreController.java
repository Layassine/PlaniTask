package com.planitask.controller;

import com.planitask.entity.Utilisateur;
import com.planitask.enums.RoleProjet;
import com.planitask.service.MembreService;
import com.planitask.service.MembreService.MembreResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projets/{projetId}/membres")
@RequiredArgsConstructor
public class MembreController {

    private final MembreService membreService;

    @GetMapping
    public ResponseEntity<List<MembreResponse>> getMembres(@PathVariable Long projetId) {
        return ResponseEntity.ok(membreService.getMembres(projetId));
    }

    @PostMapping
    public ResponseEntity<MembreResponse> ajouterMembre(
            @PathVariable Long projetId,
            @RequestBody AjouterMembreRequest request,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(membreService.ajouterMembre(
                        projetId, request.getUtilisateurId(), request.getRole(), utilisateur));
    }

    @PatchMapping("/{userId}/role")
    public ResponseEntity<MembreResponse> mettreAJourRole(
            @PathVariable Long projetId,
            @PathVariable Long userId,
            @RequestBody RoleRequest request,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(
                membreService.mettreAJourRole(projetId, userId, request.getRole(), utilisateur));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> retirerMembre(
            @PathVariable Long projetId,
            @PathVariable Long userId,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        membreService.retirerMembre(projetId, userId, utilisateur);
        return ResponseEntity.noContent().build();
    }

    @Data
    static class AjouterMembreRequest {
        private Long utilisateurId;
        private RoleProjet role;
    }

    @Data
    static class RoleRequest {
        private RoleProjet role;
    }
}
