package com.planitask.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.planitask.enums.TypeNotification;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private TypeNotification type;

    @Column(nullable = false)
    private Boolean lue = false;

    private Long projetId;

    private Long tacheId;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (lue == null) lue = false;
    }
}
