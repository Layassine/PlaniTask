package com.planitask.dto.request;

import com.planitask.enums.Priorite;
import com.planitask.enums.StatutTache;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TacheRequest {

    @NotBlank
    private String titre;

    private String description;

    @NotNull
    private Long projetId;

    private Long assigneeId;

    private StatutTache statut;

    private Priorite priorite;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Min(0) @Max(100)
    private Integer progression;

    private Double tempsEstime;

    private Double tempsReel;
}
