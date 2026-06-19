package com.planitask.entity;

import com.planitask.enums.RoleProjet;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "membres_projet",
       uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "projet_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MembreProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    private Projet projet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleProjet role;

    @Column(updatable = false)
    private LocalDateTime dateAjout;

    @PrePersist
    protected void onCreate() {
        dateAjout = LocalDateTime.now();
        if (role == null) role = RoleProjet.MEMBRE;
    }
}
