package com.planitask.repository;

import com.planitask.entity.Projet;
import com.planitask.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {

    List<Projet> findByProprietaire(Utilisateur proprietaire);

    @Query("""
        SELECT DISTINCT p FROM Projet p
        LEFT JOIN p.membres m
        WHERE p.proprietaire = :utilisateur OR m.utilisateur = :utilisateur
        ORDER BY p.dateCreation DESC
        """)
    List<Projet> findAllByUtilisateur(@Param("utilisateur") Utilisateur utilisateur);
}
