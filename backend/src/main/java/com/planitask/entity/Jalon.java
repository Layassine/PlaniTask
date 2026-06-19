package com.planitask.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "jalons")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Jalon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    private Projet projet;

    private LocalDate dateEcheance;

    @Column(nullable = false)
    private Boolean atteint = false;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (atteint == null) atteint = false;
    }
}
