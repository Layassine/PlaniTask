package com.planitask.entity;

import com.planitask.enums.Priorite;
import com.planitask.enums.StatutTache;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "taches")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Tache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    private Projet projet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private Utilisateur assignee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTache statut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priorite priorite;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Column(nullable = false)
    private Integer progression;

    private Double tempsEstime;

    private Double tempsReel;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (statut == null) statut = StatutTache.A_FAIRE;
        if (priorite == null) priorite = Priorite.MOYENNE;
        if (progression == null) progression = 0;
        if (tempsEstime == null) tempsEstime = 0.0;
        if (tempsReel == null) tempsReel = 0.0;
    }
}
