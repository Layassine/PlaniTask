package com.planitask.entity;

import com.planitask.enums.StatutProjet;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projets")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutProjet statut = StatutProjet.EN_COURS;

    @Column(nullable = false)
    private Double avancement = 0.0;

    private String couleur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proprietaire_id")
    private Utilisateur proprietaire;

    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MembreProjet> membres = new ArrayList<>();

    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Tache> taches = new ArrayList<>();

    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Jalon> jalons = new ArrayList<>();

    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Rapport> rapports = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (statut == null) statut = StatutProjet.EN_COURS;
        if (avancement == null) avancement = 0.0;
    }
}
