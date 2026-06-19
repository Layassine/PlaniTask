package com.planitask.service;

import com.planitask.entity.Projet;
import com.planitask.entity.Rapport;
import com.planitask.entity.Tache;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.FormatRapport;
import com.planitask.enums.StatutTache;
import com.planitask.repository.JalonRepository;
import com.planitask.repository.MembreProjetRepository;
import com.planitask.repository.ProjetRepository;
import com.planitask.repository.RapportRepository;
import com.planitask.repository.TacheRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RapportService {

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final JalonRepository jalonRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final RapportRepository rapportRepository;

    public RapportResponse generer(Long projetId, FormatRapport format, Utilisateur generePar) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet introuvable"));

        List<Tache> taches = tacheRepository.findByProjetId(projetId);
        long nbTerminees = taches.stream().filter(t -> StatutTache.TERMINE.equals(t.getStatut())).count();
        long nbEnCours  = taches.stream().filter(t -> StatutTache.EN_COURS.equals(t.getStatut())).count();
        long nbEnRetard = taches.stream()
                .filter(t -> t.getDateFin() != null
                        && t.getDateFin().isBefore(LocalDate.now())
                        && !StatutTache.TERMINE.equals(t.getStatut()))
                .count();
        long nbMembres       = membreProjetRepository.findByProjet(projet).size();
        long nbJalons        = jalonRepository.countByProjetId(projetId);
        long nbJalonsAtteints = jalonRepository.countByProjetIdAndAtteint(projetId, true);

        String contenu = construireContenu(projet, taches.size(), nbTerminees, nbEnCours,
                nbEnRetard, nbMembres, nbJalons, nbJalonsAtteints, format);

        String nomRapport = "Rapport_"
                + projet.getNom().replace(" ", "_")
                + "_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE);

        Rapport rapport = Rapport.builder()
                .nom(nomRapport)
                .projet(projet)
                .format(format)
                .contenu(contenu)
                .generePar(generePar)
                .build();

        rapport = rapportRepository.save(rapport);
        return toResponse(rapport);
    }

    @Transactional(readOnly = true)
    public List<RapportResponse> getRapportsProjet(Long projetId) {
        return rapportRepository.findByProjetIdOrderByDateGenerationDesc(projetId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private String construireContenu(Projet p, long nbTaches, long nbTerminees,
                                     long nbEnCours, long nbEnRetard,
                                     long nbMembres, long nbJalons, long nbJalonsAtteints,
                                     FormatRapport format) {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        double avancement = p.getAvancement() != null ? p.getAvancement() : 0.0;

        return String.format(
                "RAPPORT DE PROJET — %s%n" +
                "Généré le : %s%n" +
                "════════════════════════════════%n" +
                "Statut        : %s%n" +
                "Avancement    : %.1f%%%n" +
                "════════════════════════════════%n" +
                "TÂCHES%n" +
                "  Total        : %d%n" +
                "  Terminées    : %d%n" +
                "  En cours     : %d%n" +
                "  En retard    : %d%n" +
                "════════════════════════════════%n" +
                "ÉQUIPE%n" +
                "  Membres      : %d%n" +
                "════════════════════════════════%n" +
                "JALONS%n" +
                "  Total        : %d%n" +
                "  Atteints     : %d%n" +
                "════════════════════════════════%n" +
                "Format        : %s%n",
                p.getNom(), date, p.getStatut(), avancement,
                nbTaches, nbTerminees, nbEnCours, nbEnRetard,
                nbMembres, nbJalons, nbJalonsAtteints, format);
    }

    private RapportResponse toResponse(Rapport r) {
        return RapportResponse.builder()
                .id(r.getId())
                .nom(r.getNom())
                .projetId(r.getProjet().getId())
                .projetNom(r.getProjet().getNom())
                .format(r.getFormat())
                .contenu(r.getContenu())
                .generePar(r.getGenerePar() != null
                        ? r.getGenerePar().getNom() + " " + r.getGenerePar().getPrenom()
                        : null)
                .dateGeneration(r.getDateGeneration())
                .build();
    }

    @Data @Builder
    public static class RapportResponse {
        private Long id;
        private String nom;
        private Long projetId;
        private String projetNom;
        private FormatRapport format;
        private String contenu;
        private String generePar;
        private LocalDateTime dateGeneration;
    }
}
