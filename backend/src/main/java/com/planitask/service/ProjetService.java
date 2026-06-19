package com.planitask.service;

import com.planitask.dto.request.ProjetRequest;
import com.planitask.dto.response.ProjetResponse;
import com.planitask.entity.MembreProjet;
import com.planitask.entity.Projet;
import com.planitask.entity.Tache;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.RoleProjet;
import com.planitask.enums.StatutProjet;
import com.planitask.enums.StatutTache;
import com.planitask.repository.JalonRepository;
import com.planitask.repository.MembreProjetRepository;
import com.planitask.repository.ProjetRepository;
import com.planitask.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final JalonRepository jalonRepository;

    private void validerDates(ProjetRequest request) {
        if (request.getNom() == null || request.getNom().isBlank()) {
            throw new RuntimeException("Le nom du projet est obligatoire");
        }
        if (request.getDateDebut() != null && request.getDateFin() != null
                && !request.getDateFin().isAfter(request.getDateDebut())) {
            throw new RuntimeException("La date de fin doit être après la date de début");
        }
    }

    public ProjetResponse creer(ProjetRequest request, Utilisateur proprietaire) {
        validerDates(request);
        LocalDate today = LocalDate.now();
        if (request.getDateDebut() != null && request.getDateDebut().isBefore(today)) {
            throw new RuntimeException("La date de début doit être aujourd'hui ou dans le futur");
        }
        if (request.getDateFin() != null && request.getDateFin().isBefore(today)) {
            throw new RuntimeException("La date de fin doit être dans le futur");
        }
        Projet projet = Projet.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .couleur(request.getCouleur())
                .statut(StatutProjet.EN_COURS)
                .avancement(0.0)
                .proprietaire(proprietaire)
                .build();
        projet = projetRepository.save(projet);

        MembreProjet chef = MembreProjet.builder()
                .projet(projet)
                .utilisateur(proprietaire)
                .role(RoleProjet.CHEF_DE_PROJET)
                .build();
        membreProjetRepository.save(chef);

        return toResponse(projet);
    }

    public ProjetResponse mettreAJour(Long id, ProjetRequest request, Utilisateur utilisateur) {
        validerDates(request);
        Projet projet = getProjetOuException(id);
        verifierAcces(projet, utilisateur);

        projet.setNom(request.getNom());
        projet.setDescription(request.getDescription());
        projet.setDateDebut(request.getDateDebut());
        projet.setDateFin(request.getDateFin());
        if (request.getCouleur() != null) projet.setCouleur(request.getCouleur());

        recalculer(projet);
        projet = projetRepository.save(projet);
        return toResponse(projet);
    }

    public void supprimer(Long id, Utilisateur utilisateur) {
        Projet projet = getProjetOuException(id);
        verifierAcces(projet, utilisateur);
        projetRepository.delete(projet);
    }

    @Transactional(readOnly = true)
    public ProjetResponse getById(Long id) {
        return toResponse(getProjetOuException(id));
    }

    @Transactional(readOnly = true)
    public List<ProjetResponse> getProjetsUtilisateur(Utilisateur utilisateur) {
        return projetRepository.findAllByUtilisateur(utilisateur)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void recalculer(Projet projet) {
        List<Tache> taches = tacheRepository.findByProjetId(projet.getId());
        projet.setAvancement(calculerAvancement(taches));
        projet.setStatut(calculerStatut(projet, taches));
    }

    // ── Formule : Σ(progression × poids) / Σ(poids)
    //    poids = tempsEstime si > 0, sinon 1.0 (égalité) ──
    private double calculerAvancement(List<Tache> taches) {
        if (taches.isEmpty()) return 0.0;

        double totalPoids = taches.stream()
                .mapToDouble(t -> t.getTempsEstime() != null && t.getTempsEstime() > 0
                        ? t.getTempsEstime() : 1.0)
                .sum();

        double somme = taches.stream()
                .mapToDouble(t -> {
                    int prog = t.getProgression() != null ? t.getProgression() : 0;
                    double poids = t.getTempsEstime() != null && t.getTempsEstime() > 0
                            ? t.getTempsEstime() : 1.0;
                    return prog * poids;
                })
                .sum();

        return somme / totalPoids;
    }

    // ── Statut auto basé sur l'écart avancement attendu vs réel ──
    private StatutProjet calculerStatut(Projet projet, List<Tache> taches) {
        double avancement = projet.getAvancement();

        boolean toutesTerminees = !taches.isEmpty() &&
                taches.stream().allMatch(t -> StatutTache.TERMINE.equals(t.getStatut()));
        if (toutesTerminees || avancement >= 100) return StatutProjet.TERMINE;

        LocalDate debut = projet.getDateDebut();
        LocalDate fin = projet.getDateFin();
        LocalDate today = LocalDate.now();

        if (debut == null || fin == null) return StatutProjet.EN_COURS;
        if (today.isAfter(fin)) return StatutProjet.EN_RETARD;

        long totalJours = ChronoUnit.DAYS.between(debut, fin);
        if (totalJours <= 0) return StatutProjet.EN_COURS;

        long joursEcoules = ChronoUnit.DAYS.between(debut, today);
        if (joursEcoules < 0) return StatutProjet.EN_ATTENTE;

        double avancementAttendu = Math.min(100.0, (double) joursEcoules / totalJours * 100.0);
        double ecart = avancementAttendu - avancement;

        if (ecart <= 10) return StatutProjet.EN_COURS;
        if (ecart <= 25) return StatutProjet.A_RISQUE;
        return StatutProjet.EN_RETARD;
    }

    public Projet getProjetOuException(Long id) {
        return projetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet introuvable : " + id));
    }

    private void verifierAcces(Projet projet, Utilisateur utilisateur) {
        if (projet.getProprietaire().getId().equals(utilisateur.getId())) return;
        MembreProjet membre = membreProjetRepository
                .findByProjetAndUtilisateur(projet, utilisateur)
                .orElseThrow(() -> new RuntimeException("Accès refusé au projet " + projet.getId()));
        if (membre.getRole() != RoleProjet.CHEF_DE_PROJET) {
            throw new RuntimeException("Seul le chef de projet peut modifier ou supprimer ce projet");
        }
    }

    public ProjetResponse toResponse(Projet p) {
        long nbTaches = tacheRepository.countByProjetId(p.getId());
        long nbTerminees = tacheRepository.countByProjetIdAndStatut(p.getId(), StatutTache.TERMINE);
        long nbEnRetard = tacheRepository.findTachesEnRetardByProjet(p.getId(), LocalDate.now(), StatutTache.TERMINE).size();
        long nbJalons = jalonRepository.countByProjetId(p.getId());
        long nbJalonsAtteints = jalonRepository.countByProjetIdAndAtteint(p.getId(), true);
        long nbMembres = membreProjetRepository.findByProjet(p).size();

        return ProjetResponse.builder()
                .id(p.getId())
                .nom(p.getNom())
                .description(p.getDescription())
                .dateDebut(p.getDateDebut())
                .dateFin(p.getDateFin())
                .statut(p.getStatut())
                .avancement(p.getAvancement())
                .couleur(p.getCouleur())
                .proprietaireId(p.getProprietaire() != null ? p.getProprietaire().getId() : null)
                .proprietaireNom(p.getProprietaire() != null ? p.getProprietaire().getNom() : null)
                .proprietairePrenom(p.getProprietaire() != null ? p.getProprietaire().getPrenom() : null)
                .proprietaireEmail(p.getProprietaire() != null ? p.getProprietaire().getEmail() : null)
                .proprietaireAvatar(p.getProprietaire() != null ? p.getProprietaire().getAvatar() : null)
                .nombreMembres(nbMembres)
                .nombreTaches(nbTaches)
                .nombreTachesTerminees(nbTerminees)
                .nombreTachesEnRetard(nbEnRetard)
                .nombreJalons(nbJalons)
                .nombreJalonsAtteints(nbJalonsAtteints)
                .dateCreation(p.getDateCreation())
                .build();
    }
}
