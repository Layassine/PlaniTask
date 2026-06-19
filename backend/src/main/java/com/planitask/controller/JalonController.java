package com.planitask.controller;

import com.planitask.entity.Jalon;
import com.planitask.entity.Projet;
import com.planitask.entity.Utilisateur;
import com.planitask.repository.JalonRepository;
import com.planitask.service.ProjetService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projets/{projetId}/jalons")
@RequiredArgsConstructor
public class JalonController {

    private final JalonRepository jalonRepository;
    private final ProjetService projetService;

    @GetMapping
    public List<JalonDto> getJalons(@PathVariable Long projetId) {
        return jalonRepository.findByProjetId(projetId).stream()
                .map(JalonDto::from)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<JalonDto> creer(
            @PathVariable Long projetId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        Projet projet = projetService.getProjetOuException(projetId);
        if (!projet.getProprietaire().getId().equals(utilisateur.getId()))
            throw new RuntimeException("Seul le chef de projet peut créer des jalons");
        Jalon jalon = Jalon.builder()
                .nom((String) body.get("nom"))
                .description((String) body.getOrDefault("description", ""))
                .projet(projet)
                .dateEcheance(body.get("dateEcheance") != null
                        ? LocalDate.parse((String) body.get("dateEcheance")) : null)
                .atteint(false)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(JalonDto.from(jalonRepository.save(jalon)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JalonDto> modifier(
            @PathVariable Long projetId,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        Projet projet = projetService.getProjetOuException(projetId);
        if (!projet.getProprietaire().getId().equals(utilisateur.getId()))
            throw new RuntimeException("Seul le chef de projet peut modifier les jalons");
        Jalon jalon = jalonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jalon introuvable"));
        if (body.get("nom") != null) jalon.setNom((String) body.get("nom"));
        String dateStr = (String) body.get("dateEcheance");
        jalon.setDateEcheance(dateStr != null && !dateStr.isEmpty() ? LocalDate.parse(dateStr) : null);
        return ResponseEntity.ok(JalonDto.from(jalonRepository.save(jalon)));
    }

    @PatchMapping("/{id}/atteint")
    public ResponseEntity<JalonDto> toggleAtteint(
            @PathVariable Long projetId,
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        Projet projet = projetService.getProjetOuException(projetId);
        if (!projet.getProprietaire().getId().equals(utilisateur.getId()))
            throw new RuntimeException("Seul le chef de projet peut modifier les jalons");
        Jalon jalon = jalonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jalon introuvable"));
        jalon.setAtteint(!jalon.getAtteint());
        return ResponseEntity.ok(JalonDto.from(jalonRepository.save(jalon)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long projetId,
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        Projet projet = projetService.getProjetOuException(projetId);
        if (!projet.getProprietaire().getId().equals(utilisateur.getId()))
            throw new RuntimeException("Seul le chef de projet peut supprimer des jalons");
        jalonRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Data @AllArgsConstructor
    public static class JalonDto {
        private Long id;
        private String nom;
        private String description;
        private String dateEcheance;
        private Boolean atteint;
        private Long projetId;

        static JalonDto from(Jalon j) {
            return new JalonDto(j.getId(), j.getNom(), j.getDescription(),
                    j.getDateEcheance() != null ? j.getDateEcheance().toString() : null,
                    j.getAtteint(), j.getProjet().getId());
        }
    }
}
