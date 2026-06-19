package com.planitask.entity;

import com.planitask.enums.FormatRapport;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rapports")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Rapport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    private Projet projet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormatRapport format;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genere_par_id")
    private Utilisateur generePar;

    @Column(updatable = false)
    private LocalDateTime dateGeneration;

    @PrePersist
    protected void onCreate() {
        dateGeneration = LocalDateTime.now();
        if (format == null) format = FormatRapport.HTML;
    }
}
