package com.planitask.controller;

import com.planitask.dto.request.TacheRequest;
import com.planitask.dto.response.TacheResponse;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.StatutTache;
import com.planitask.service.TacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/taches")
@RequiredArgsConstructor
public class TacheController {

    private final TacheService tacheService;

    @GetMapping
    public ResponseEntity<List<TacheResponse>> getTachesProjet(
            @RequestParam Long projetId) {
        return ResponseEntity.ok(tacheService.getTachesProjet(projetId));
    }

    @GetMapping("/mes-taches")
    public ResponseEntity<List<TacheResponse>> getMesTaches(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(tacheService.getMesTaches(utilisateur));
    }

    @GetMapping("/assignees")
    public ResponseEntity<List<TacheResponse>> getTachesAssignees(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(tacheService.getTachesAssignees(utilisateur));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TacheResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tacheService.getById(id));
    }

    @PostMapping
    public ResponseEntity<TacheResponse> creer(
            @Valid @RequestBody TacheRequest request,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tacheService.creer(request, utilisateur));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TacheResponse> mettreAJour(
            @PathVariable Long id,
            @Valid @RequestBody TacheRequest request,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(tacheService.mettreAJour(id, request, utilisateur));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TacheResponse> patchStatut(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        TacheResponse tache = tacheService.getById(id);
        if (tache.getDateDebut() != null && tache.getDateDebut().isAfter(LocalDate.now())) {
            throw new RuntimeException("Impossible de modifier le statut : la tâche n'a pas encore commencé (début prévu le " + tache.getDateDebut() + ")");
        }
        TacheRequest req = new TacheRequest();
        req.setTitre(tache.getTitre());
        req.setProjetId(tache.getProjetId());
        if (body.containsKey("statut")) {
            req.setStatut(StatutTache.valueOf((String) body.get("statut")));
        }
        if (body.containsKey("progression")) {
            req.setProgression((Integer) body.get("progression"));
        }
        return ResponseEntity.ok(tacheService.mettreAJour(id, req, utilisateur));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        tacheService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
