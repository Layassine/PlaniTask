package com.planitask.repository;

import com.planitask.entity.MembreProjet;
import com.planitask.entity.Projet;
import com.planitask.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembreProjetRepository extends JpaRepository<MembreProjet, Long> {

    List<MembreProjet> findByProjet(Projet projet);

    List<MembreProjet> findByUtilisateur(Utilisateur utilisateur);

    Optional<MembreProjet> findByProjetAndUtilisateur(Projet projet, Utilisateur utilisateur);

    boolean existsByProjetAndUtilisateur(Projet projet, Utilisateur utilisateur);

    void deleteByProjetAndUtilisateur(Projet projet, Utilisateur utilisateur);
}
