package com.planitask.dto.response;

import com.planitask.enums.StatutProjet;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ProjetResponse {

    private Long id;
    private String nom;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private StatutProjet statut;
    private Double avancement;
    private String couleur;

    private Long proprietaireId;
    private String proprietaireNom;
    private String proprietairePrenom;
    private String proprietaireEmail;
    private String proprietaireAvatar;

    private long nombreMembres;
    private long nombreTaches;
    private long nombreTachesTerminees;
    private long nombreTachesEnRetard;
    private long nombreJalons;
    private long nombreJalonsAtteints;

    private LocalDateTime dateCreation;
}
