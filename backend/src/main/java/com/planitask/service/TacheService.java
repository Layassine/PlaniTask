package com.planitask.service;

import com.planitask.dto.request.TacheRequest;
import com.planitask.dto.response.TacheResponse;
import com.planitask.entity.Projet;
import com.planitask.entity.Tache;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.Priorite;
import com.planitask.enums.StatutTache;
import com.planitask.enums.TypeNotification;
import com.planitask.repository.MembreProjetRepository;
import com.planitask.repository.TacheRepository;
import com.planitask.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final ProjetService projetService;
    private final NotificationService notificationService;

    private void validerTache(TacheRequest request) {
        if (request.getTitre() == null || request.getTitre().isBlank()) {
            throw new RuntimeException("Le titre de la tâche est obligatoire");
        }
        if (request.getProgression() != null && (request.getProgression() < 0 || request.getProgression() > 100)) {
            throw new RuntimeException("La progression doit être comprise entre 0 et 100");
        }
        if (request.getTempsEstime() != null && request.getTempsEstime() < 0) {
            throw new RuntimeException("Le temps estimé ne peut pas être négatif");
        }
        if (request.getDateDebut() != null && request.getDateFin() != null
                && request.getDateFin().isBefore(request.getDateDebut())) {
            throw new RuntimeException("La date d'échéance doit être après la date de début");
        }
    }

    public TacheResponse creer(TacheRequest request, Utilisateur createur) {
        validerTache(request);
        LocalDate today = LocalDate.now();
        if (request.getDateDebut() != null && request.getDateDebut().isBefore(today)) {
            throw new RuntimeException("La date de début doit être aujourd'hui ou dans le futur");
        }
        if (request.getDateFin() != null && request.getDateFin().isBefore(today)) {
            throw new RuntimeException("La date d'échéance doit être dans le futur");
        }
        Projet projet = projetService.getProjetOuException(request.getProjetId());

        if (!projet.getProprietaire().getId().equals(createur.getId())) {
            throw new RuntimeException("Seul le chef de projet peut créer une tâche");
        }

        Utilisateur assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = utilisateurRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            if (!membreProjetRepository.existsByProjetAndUtilisateur(projet, assignee)) {
                throw new RuntimeException("Cet utilisateur n'est pas membre du projet");
            }
        }

        Tache tache = Tache.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .projet(projet)
                .assignee(assignee)
                .statut(request.getStatut() != null ? request.getStatut() : StatutTache.A_FAIRE)
                .priorite(request.getPriorite() != null ? request.getPriorite() : Priorite.MOYENNE)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .progression(request.getStatut() == StatutTache.TERMINE ? 100
                        : (request.getProgression() != null ? request.getProgression() : 0))
                .tempsEstime(request.getTempsEstime() != null ? request.getTempsEstime() : 0.0)
                .tempsReel(request.getTempsReel() != null ? request.getTempsReel() : 0.0)
                .build();

        tache = tacheRepository.save(tache);

        if (assignee != null && !assignee.getId().equals(createur.getId())) {
            notificationService.creer(
                    assignee,
                    "Vous avez été assigné(e) à la tâche : " + tache.getTitre(),
                    TypeNotification.TACHE_ASSIGNEE,
                    projet.getId(),
                    tache.getId());
        }

        projetService.recalculer(projet);

        return toResponse(tache);
    }

    public TacheResponse mettreAJour(Long id, TacheRequest request, Utilisateur demandeur) {
        validerTache(request);
        Tache tache = getTacheOuException(id);

        boolean estChef = tache.getProjet().getProprietaire().getId().equals(demandeur.getId());
        boolean estAssigne = tache.getAssignee() != null
                && tache.getAssignee().getId().equals(demandeur.getId());
        if (!estChef && !estAssigne) {
            throw new RuntimeException("Seul le chef de projet ou le membre assigné peut modifier cette tâche");
        }

        Utilisateur ancienAssignee = tache.getAssignee();

        tache.setTitre(request.getTitre());
        if (request.getDescription() != null) tache.setDescription(request.getDescription());
        if (request.getStatut() != null) tache.setStatut(request.getStatut());
        if (request.getPriorite() != null) tache.setPriorite(request.getPriorite());
        if (request.getDateDebut() != null) tache.setDateDebut(request.getDateDebut());
        if (request.getDateFin() != null) tache.setDateFin(request.getDateFin());
        if (request.getTempsEstime() != null) tache.setTempsEstime(request.getTempsEstime());
        if (request.getTempsReel() != null) tache.setTempsReel(request.getTempsReel());
        // TERMINE → progression forcée à 100 ; sinon on applique la valeur fournie
        if (tache.getStatut() == StatutTache.TERMINE) {
            tache.setProgression(100);
        } else if (request.getProgression() != null) {
            tache.setProgression(request.getProgression());
        }

        if (request.getAssigneeId() != null) {
            Utilisateur nouvelAssignee = utilisateurRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            if (!membreProjetRepository.existsByProjetAndUtilisateur(tache.getProjet(), nouvelAssignee)) {
                throw new RuntimeException("Cet utilisateur n'est pas membre du projet");
            }
            if (ancienAssignee == null || !ancienAssignee.getId().equals(nouvelAssignee.getId())) {
                tache.setAssignee(nouvelAssignee);
                notificationService.creer(
                        nouvelAssignee,
                        "Vous avez été assigné(e) à la tâche : " + tache.getTitre(),
                        TypeNotification.TACHE_ASSIGNEE,
                        tache.getProjet().getId(),
                        tache.getId());
            }
        }

        tache = tacheRepository.save(tache);
        projetService.recalculer(tache.getProjet());

        return toResponse(tache);
    }

    public void supprimer(Long id) {
        Tache tache = getTacheOuException(id);
        Projet projet = tache.getProjet();
        tacheRepository.delete(tache);
        projetService.recalculer(projet);
    }

    @Transactional(readOnly = true)
    public TacheResponse getById(Long id) {
        return toResponse(getTacheOuException(id));
    }

    @Transactional(readOnly = true)
    public List<TacheResponse> getTachesProjet(Long projetId) {
        return tacheRepository.findByProjetId(projetId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TacheResponse> getMesTaches(Utilisateur utilisateur) {
        return tacheRepository.findAllForUser(utilisateur)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TacheResponse> getTachesAssignees(Utilisateur utilisateur) {
        return tacheRepository.findByAssignee(utilisateur)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public Tache getTacheOuException(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tâche introuvable : " + id));
    }

    // Tâche en retard : dateFin < today AND statut ≠ TERMINE
    public boolean isEnRetard(Tache tache) {
        return tache.getDateFin() != null
                && tache.getDateFin().isBefore(LocalDate.now())
                && !StatutTache.TERMINE.equals(tache.getStatut());
    }

    public TacheResponse toResponse(Tache t) {
        return TacheResponse.builder()
                .id(t.getId())
                .titre(t.getTitre())
                .description(t.getDescription())
                .projetId(t.getProjet() != null ? t.getProjet().getId() : null)
                .projetNom(t.getProjet() != null ? t.getProjet().getNom() : null)
                .assigneeId(t.getAssignee() != null ? t.getAssignee().getId() : null)
                .assigneeNom(t.getAssignee() != null ? t.getAssignee().getNom() : null)
                .assigneePrenom(t.getAssignee() != null ? t.getAssignee().getPrenom() : null)
                .assigneeEmail(t.getAssignee() != null ? t.getAssignee().getEmail() : null)
                .assigneeAvatar(t.getAssignee() != null ? t.getAssignee().getAvatar() : null)
                .statut(t.getStatut())
                .priorite(t.getPriorite())
                .dateDebut(t.getDateDebut())
                .dateFin(t.getDateFin())
                .progression(t.getProgression())
                .tempsEstime(t.getTempsEstime())
                .tempsReel(t.getTempsReel())
                .enRetard(isEnRetard(t))
                .dateCreation(t.getDateCreation())
                .build();
    }
}
