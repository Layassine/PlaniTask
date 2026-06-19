package com.planitask.service;

import com.planitask.entity.Notification;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.TypeNotification;
import com.planitask.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void creer(Utilisateur destinataire, String message, TypeNotification type,
                      Long projetId, Long tacheId) {
        Notification notif = Notification.builder()
                .utilisateur(destinataire)
                .message(message)
                .type(type)
                .projetId(projetId)
                .tacheId(tacheId)
                .lue(false)
                .build();
        notificationRepository.save(notif);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(Utilisateur utilisateur) {
        return notificationRepository.findByUtilisateurOrderByDateCreationDesc(utilisateur);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNonLues(Utilisateur utilisateur) {
        return notificationRepository.findByUtilisateurAndLueFalseOrderByDateCreationDesc(utilisateur);
    }

    @Transactional(readOnly = true)
    public long compterNonLues(Utilisateur utilisateur) {
        return notificationRepository.countByUtilisateurAndLueFalse(utilisateur);
    }

    public void marquerLue(Long id, Utilisateur utilisateur) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUtilisateur().getId().equals(utilisateur.getId())) {
                n.setLue(true);
                notificationRepository.save(n);
            }
        });
    }

    public void marquerToutesLues(Utilisateur utilisateur) {
        notificationRepository.marquerToutesLues(utilisateur);
    }

    public void supprimer(Long id, Utilisateur utilisateur) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUtilisateur().getId().equals(utilisateur.getId())) {
                notificationRepository.delete(n);
            }
        });
    }
}
