package com.planitask.service;

import com.planitask.entity.MembreProjet;
import com.planitask.entity.Projet;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.RoleProjet;
import com.planitask.enums.TypeNotification;
import com.planitask.repository.MembreProjetRepository;
import com.planitask.repository.UtilisateurRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MembreService {

    private final MembreProjetRepository membreProjetRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ProjetService projetService;
    private final NotificationService notificationService;

    public MembreResponse ajouterMembre(Long projetId, Long utilisateurId,
                                        RoleProjet role, Utilisateur demandeur) {
        Projet projet = projetService.getProjetOuException(projetId);
        verifierAdmin(projet, demandeur);

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (membreProjetRepository.existsByProjetAndUtilisateur(projet, utilisateur)) {
            throw new RuntimeException("Cet utilisateur est déjà membre du projet");
        }

        MembreProjet membre = MembreProjet.builder()
                .projet(projet)
                .utilisateur(utilisateur)
                .role(RoleProjet.MEMBRE)
                .build();
        membre = membreProjetRepository.save(membre);

        notificationService.creer(
                utilisateur,
                "Vous avez été ajouté(e) au projet : " + projet.getNom(),
                TypeNotification.MEMBRE_AJOUTE,
                projet.getId(),
                null);

        return toResponse(membre);
    }

    public void retirerMembre(Long projetId, Long utilisateurId, Utilisateur demandeur) {
        Projet projet = projetService.getProjetOuException(projetId);
        verifierAdmin(projet, demandeur);

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (projet.getProprietaire().getId().equals(utilisateurId)) {
            throw new RuntimeException("Impossible de retirer le propriétaire du projet");
        }

        membreProjetRepository.deleteByProjetAndUtilisateur(projet, utilisateur);
    }

    @Transactional(readOnly = true)
    public List<MembreResponse> getMembres(Long projetId) {
        Projet projet = projetService.getProjetOuException(projetId);
        return membreProjetRepository.findByProjet(projet)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MembreResponse mettreAJourRole(Long projetId, Long utilisateurId,
                                          RoleProjet role, Utilisateur demandeur) {
        Projet projet = projetService.getProjetOuException(projetId);
        verifierAdmin(projet, demandeur);

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        MembreProjet membre = membreProjetRepository.findByProjetAndUtilisateur(projet, utilisateur)
                .orElseThrow(() -> new RuntimeException("Membre introuvable"));

        if (role == RoleProjet.CHEF_DE_PROJET) {
            throw new RuntimeException("Impossible d'assigner le rôle Chef de projet — il ne peut y en avoir qu'un par projet");
        }
        membre.setRole(role);
        return toResponse(membreProjetRepository.save(membre));
    }

    private void verifierAdmin(Projet projet, Utilisateur utilisateur) {
        boolean estProprietaire = projet.getProprietaire().getId().equals(utilisateur.getId());
        if (estProprietaire) return;
        MembreProjet membre = membreProjetRepository
                .findByProjetAndUtilisateur(projet, utilisateur)
                .orElseThrow(() -> new RuntimeException("Accès refusé"));
        if (membre.getRole() != RoleProjet.CHEF_DE_PROJET) {
            throw new RuntimeException("Seul le chef de projet peut gérer les membres");
        }
    }

    private MembreResponse toResponse(MembreProjet m) {
        return MembreResponse.builder()
                .id(m.getId())
                .utilisateurId(m.getUtilisateur().getId())
                .nom(m.getUtilisateur().getNom())
                .prenom(m.getUtilisateur().getPrenom())
                .email(m.getUtilisateur().getEmail())
                .avatar(m.getUtilisateur().getAvatar())
                .role(m.getRole())
                .dateAjout(m.getDateAjout())
                .build();
    }

    @Data @Builder
    public static class MembreResponse {
        private Long id;
        private Long utilisateurId;
        private String nom;
        private String prenom;
        private String email;
        private String avatar;
        private RoleProjet role;
        private java.time.LocalDateTime dateAjout;
    }
}
