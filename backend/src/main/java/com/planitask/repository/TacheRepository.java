package com.planitask.repository;

import com.planitask.entity.Tache;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.StatutTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {

    List<Tache> findByProjetId(Long projetId);

    List<Tache> findByAssignee(Utilisateur assignee);

    List<Tache> findByProjetIdAndStatut(Long projetId, StatutTache statut);

    @Query("SELECT t FROM Tache t WHERE t.dateFin < :today AND t.statut <> :statut")
    List<Tache> findTachesEnRetard(
            @Param("today") LocalDate today,
            @Param("statut") StatutTache statut);

    @Query("SELECT t FROM Tache t WHERE t.projet.id = :projetId AND t.dateFin < :today AND t.statut <> :statut")
    List<Tache> findTachesEnRetardByProjet(
            @Param("projetId") Long projetId,
            @Param("today") LocalDate today,
            @Param("statut") StatutTache statut);

    long countByProjetId(Long projetId);

    long countByProjetIdAndStatut(Long projetId, StatutTache statut);

    @Query("""
        SELECT t FROM Tache t
        WHERE t.projet.proprietaire = :user
           OR EXISTS (
               SELECT m FROM MembreProjet m
               WHERE m.projet = t.projet AND m.utilisateur = :user
           )
        ORDER BY t.dateCreation DESC
        """)
    List<Tache> findAllForUser(@Param("user") Utilisateur user);

    @Query("""
        SELECT t FROM Tache t
        WHERE (t.projet.proprietaire = :user
           OR EXISTS (
               SELECT m FROM MembreProjet m
               WHERE m.projet = t.projet AND m.utilisateur = :user
           ))
        AND t.statut <> :statut
        AND t.dateFin < :today
        ORDER BY t.dateFin ASC
        """)
    List<Tache> findOverdueForUser(@Param("user") Utilisateur user,
                                   @Param("today") LocalDate today,
                                   @Param("statut") StatutTache statut);

    @Query("""
        SELECT t FROM Tache t
        WHERE (t.projet.proprietaire = :user
           OR EXISTS (
               SELECT m FROM MembreProjet m
               WHERE m.projet = t.projet AND m.utilisateur = :user
           ))
        AND t.statut <> :statut
        AND t.dateFin >= :today
        ORDER BY t.dateFin ASC
        """)
    List<Tache> findUpcomingForUser(@Param("user") Utilisateur user,
                                    @Param("today") LocalDate today,
                                    @Param("statut") StatutTache statut);
}
