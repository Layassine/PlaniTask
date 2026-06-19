package com.planitask.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    @Value("${BREVO_API_KEY:}")
    private String apiKey;

    @Value("${BREVO_SMTP_USERNAME:}")
    private String senderEmail;

    @Value("${FRONTEND_URL:https://plani-task-project.vercel.app}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getFrontendUrl() { return frontendUrl; }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public boolean envoyerReinitialisationMdp(String destinataire, String token) {
        if (!isConfigured()) {
            log.info("[MODE DÉMO] Reset mdp pour {} — token: {}", destinataire, token);
            return false;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            String lien = frontendUrl + "/reset-password?token=" + token;
            String texte = "Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe PlaniTask.\n\n"
                    + "Cliquez sur le lien ci-dessous (valable 1 heure) :\n" + lien
                    + "\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe PlaniTask";

            Map<String, Object> body = Map.of(
                "sender", Map.of("name", "PlaniTask", "email", senderEmail.isBlank() ? "noreply@planitask.fr" : senderEmail),
                "to", List.of(Map.of("email", destinataire)),
                "subject", "PlaniTask — Réinitialisation de votre mot de passe",
                "textContent", texte
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.brevo.com/v3/smtp/email", request, String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email envoyé via Brevo API à {}", destinataire);
                return true;
            } else {
                log.error("Brevo API erreur {}: {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("Erreur envoi email à {}: {}", destinataire, e.getMessage());
            return false;
        }
    }
}
