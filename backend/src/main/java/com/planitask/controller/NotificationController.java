package com.planitask.controller;

import com.planitask.entity.Notification;
import com.planitask.entity.Utilisateur;
import com.planitask.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(notificationService.getNotifications(utilisateur));
    }

    @GetMapping("/non-lues")
    public ResponseEntity<List<Notification>> getNonLues(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(notificationService.getNonLues(utilisateur));
    }

    @GetMapping("/compteur")
    public ResponseEntity<Map<String, Long>> getCompteur(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        long count = notificationService.compterNonLues(utilisateur);
        return ResponseEntity.ok(Map.of("nonLues", count));
    }

    @PutMapping("/{id}/lire")
    public ResponseEntity<Void> marquerLue(
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        notificationService.marquerLue(id, utilisateur);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/lire-toutes")
    public ResponseEntity<Void> marquerToutesLues(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        notificationService.marquerToutesLues(utilisateur);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        notificationService.supprimer(id, utilisateur);
        return ResponseEntity.noContent().build();
    }
}
