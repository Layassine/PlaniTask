package com.planitask.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjetRequest {

    @NotBlank
    private String nom;

    private String description;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private String couleur;
}
