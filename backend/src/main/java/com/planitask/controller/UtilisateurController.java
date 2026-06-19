package com.planitask.controller;

import com.planitask.entity.Tache;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.StatutTache;
import com.planitask.repository.ProjetRepository;
import com.planitask.repository.TacheRepository;
import com.planitask.repository.UtilisateurRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final TacheRepository tacheRepository;
    private final ProjetRepository projetRepository;

    @GetMapping
    public List<UtilisateurDto> getAll() {
        return utilisateurRepository.findAll().stream()
                .map(UtilisateurDto::from)
                .collect(Collectors.toList());
    }

    @GetMapping("/me")
    public UtilisateurProfilDto getMe(@AuthenticationPrincipal Utilisateur utilisateur) {
        return buildProfil(utilisateur);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurProfilDto> getById(@PathVariable Long id,
                                                        @AuthenticationPrincipal Utilisateur connecte) {
        return utilisateurRepository.findById(id)
                .map(this::buildProfil)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<UtilisateurDto> updateMe(
            @AuthenticationPrincipal Utilisateur utilisateur,
            @RequestBody Map<String, String> body) {
        Utilisateur u = utilisateurRepository.findById(utilisateur.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (body.containsKey("nom"))       u.setNom(body.get("nom"));
        if (body.containsKey("prenom"))    u.setPrenom(body.get("prenom"));
        if (body.containsKey("email"))     u.setEmail(body.get("email"));
        if (body.containsKey("avatar"))    u.setAvatar(body.get("avatar"));
        if (body.containsKey("poste"))     u.setPoste(body.get("poste"));
        if (body.containsKey("telephone")) u.setTelephone(body.get("telephone"));
        if (body.containsKey("bio"))       u.setBio(body.get("bio"));
        utilisateurRepository.save(u);
        return ResponseEntity.ok(UtilisateurDto.from(u));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Utilisateur utilisateur,
            @RequestBody Map<String, String> body) {
        String actuel = body.get("actuel");
        String nouveau = body.get("nouveau");
        if (actuel == null || nouveau == null) return ResponseEntity.badRequest().build();
        Utilisateur u = utilisateurRepository.findById(utilisateur.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (!passwordEncoder.matches(actuel, u.getMotDePasse())) {
            return ResponseEntity.status(401).build();
        }
        u.setMotDePasse(passwordEncoder.encode(nouveau));
        utilisateurRepository.save(u);
        return ResponseEntity.ok().build();
    }

    private UtilisateurProfilDto buildProfil(Utilisateur u) {
        List<Tache> taches = tacheRepository.findByAssignee(u);
        long nbAssignees = taches.size();
        long nbTerminees = taches.stream().filter(t -> StatutTache.TERMINE.equals(t.getStatut())).count();
        long nbProjets = projetRepository.findAllByUtilisateur(u).size();
        int productivite = nbAssignees > 0 ? (int) Math.round((double) nbTerminees / nbAssignees * 100) : 0;

        // Tasks completed per month (last 6 months)
        LocalDate now = LocalDate.now();
        List<Map<String, Object>> tachesParMois = new java.util.ArrayList<>();
        String[] moisLabels = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
                               "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"};
        for (int i = 5; i >= 0; i--) {
            LocalDate mois = now.minusMonths(i);
            final int m = mois.getMonthValue();
            final int y = mois.getYear();
            long count = taches.stream()
                    .filter(t -> StatutTache.TERMINE.equals(t.getStatut())
                            && t.getDateFin() != null
                            && t.getDateFin().getMonthValue() == m
                            && t.getDateFin().getYear() == y)
                    .count();
            tachesParMois.add(Map.of("mois", moisLabels[m - 1], "taches", count));
        }

        return UtilisateurProfilDto.builder()
                .id(u.getId())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .avatar(u.getAvatar())
                .poste(u.getPoste())
                .telephone(u.getTelephone())
                .bio(u.getBio())
                .dateInscription(u.getDateCreation())
                .nbTachesAssignees(nbAssignees)
                .nbTachesTerminees(nbTerminees)
                .nbProjets(nbProjets)
                .productivite(productivite)
                .tachesParMois(tachesParMois)
                .build();
    }

    @Data
    @AllArgsConstructor
    public static class UtilisateurDto {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
        private String avatar;
        private String poste;
        private String telephone;

        static UtilisateurDto from(Utilisateur u) {
            return new UtilisateurDto(u.getId(), u.getNom(), u.getPrenom(),
                    u.getEmail(), u.getAvatar(), u.getPoste(), u.getTelephone());
        }
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class UtilisateurProfilDto {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
        private String avatar;
        private String poste;
        private String telephone;
        private String bio;
        private LocalDateTime dateInscription;
        private long nbTachesAssignees;
        private long nbTachesTerminees;
        private long nbProjets;
        private int productivite;
        private List<Map<String, Object>> tachesParMois;
    }
}
