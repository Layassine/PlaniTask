package com.planitask.controller;

import com.planitask.dto.response.TacheResponse;
import com.planitask.entity.Notification;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.StatutProjet;
import com.planitask.enums.StatutTache;
import com.planitask.repository.NotificationRepository;
import com.planitask.repository.ProjetRepository;
import com.planitask.service.TacheService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProjetRepository projetRepository;
    private final TacheService tacheService;
    private final NotificationRepository notificationRepository;

    @GetMapping("/stats")
    public DashboardStats getStats(@AuthenticationPrincipal Utilisateur utilisateur) {
        var projets = projetRepository.findAllByUtilisateur(utilisateur);
        var taches = tacheService.getMesTaches(utilisateur);

        long projetsActifs = projets.stream()
                .filter(p -> p.getStatut() == StatutProjet.EN_COURS
                          || p.getStatut() == StatutProjet.A_RISQUE
                          || p.getStatut() == StatutProjet.EN_RETARD)
                .count();

        long tachesCompletees = taches.stream()
                .filter(t -> t.getStatut() == StatutTache.TERMINE)
                .count();

        long tachesEnRetard = taches.stream()
                .filter(TacheResponse::isEnRetard)
                .count();

        int workloadEquipe = projets.isEmpty() ? 0 :
                (int) Math.round(projets.stream()
                        .mapToDouble(p -> p.getAvancement() != null ? p.getAvancement() : 0.0)
                        .average().orElse(0));

        List<Notification> notifs = notificationRepository
                .findByUtilisateurOrderByDateCreationDesc(utilisateur);
        List<ActivityItem> activite = notifs.stream().limit(5).map(n -> ActivityItem.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType().name())
                .dateCreation(n.getDateCreation())
                .lue(n.getLue())
                .build()).collect(Collectors.toList());

        List<DeadlineItem> deadlines = taches.stream()
                .filter(t -> t.getDateFin() != null && t.getStatut() != StatutTache.TERMINE)
                .filter(t -> LocalDate.parse(t.getDateFin().toString()).isAfter(LocalDate.now().minusDays(1)))
                .sorted((a, b) -> a.getDateFin().compareTo(b.getDateFin()))
                .limit(5)
                .map(t -> DeadlineItem.builder()
                        .id(t.getId())
                        .titre(t.getTitre())
                        .projetNom(t.getProjetNom())
                        .dateFin(t.getDateFin() != null ? t.getDateFin().toString() : null)
                        .priorite(t.getPriorite() != null ? t.getPriorite().name() : "MOYENNE")
                        .enRetard(t.isEnRetard())
                        .build())
                .collect(Collectors.toList());

        return DashboardStats.builder()
                .projetsActifs((int) projetsActifs)
                .tachesCompletees(tachesCompletees)
                .tachesEnRetard(tachesEnRetard)
                .workloadEquipe(workloadEquipe)
                .activiteRecente(activite)
                .deadlinesAVenir(deadlines)
                .build();
    }

    @Data @Builder
    public static class DashboardStats {
        private int projetsActifs;
        private long tachesCompletees;
        private long tachesEnRetard;
        private int workloadEquipe;
        private List<ActivityItem> activiteRecente;
        private List<DeadlineItem> deadlinesAVenir;
    }

    @Data @Builder
    public static class ActivityItem {
        private Long id;
        private String message;
        private String type;
        private LocalDateTime dateCreation;
        private Boolean lue;
    }

    @Data @Builder
    public static class DeadlineItem {
        private Long id;
        private String titre;
        private String projetNom;
        private String dateFin;
        private String priorite;
        private boolean enRetard;
    }
}
