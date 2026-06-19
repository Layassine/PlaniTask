package com.planitask.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fichiers")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Fichier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private String chemin;

    private Long taille;

    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploadeur_id")
    private Utilisateur uploadeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tache_id")
    private Tache tache;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id")
    private Projet projet;

    @Column(updatable = false)
    private LocalDateTime dateUpload;

    @PrePersist
    protected void onCreate() {
        dateUpload = LocalDateTime.now();
    }
}
