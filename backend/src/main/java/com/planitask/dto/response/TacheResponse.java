package com.planitask.dto.response;

import com.planitask.enums.Priorite;
import com.planitask.enums.StatutTache;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TacheResponse {

    private Long id;
    private String titre;
    private String description;

    private Long projetId;
    private String projetNom;

    private Long assigneeId;
    private String assigneeNom;
    private String assigneePrenom;
    private String assigneeEmail;
    private String assigneeAvatar;

    private StatutTache statut;
    private Priorite priorite;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer progression;
    private Double tempsEstime;
    private Double tempsReel;
    private boolean enRetard;

    private LocalDateTime dateCreation;
}
