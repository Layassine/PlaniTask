package com.planitask.repository;

import com.planitask.entity.Notification;
import com.planitask.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUtilisateurOrderByDateCreationDesc(Utilisateur utilisateur);

    List<Notification> findByUtilisateurAndLueFalseOrderByDateCreationDesc(Utilisateur utilisateur);

    long countByUtilisateurAndLueFalse(Utilisateur utilisateur);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true WHERE n.utilisateur = :utilisateur AND n.lue = false")
    void marquerToutesLues(@Param("utilisateur") Utilisateur utilisateur);
}
