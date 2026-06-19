package com.planitask.service;

import com.planitask.dto.request.LoginRequest;
import com.planitask.dto.request.RegisterRequest;
import com.planitask.dto.response.JwtResponse;
import com.planitask.entity.PasswordResetToken;
import com.planitask.entity.Utilisateur;
import com.planitask.repository.PasswordResetTokenRepository;
import com.planitask.repository.UtilisateurRepository;
import com.planitask.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé : " + email));
    }

    @Transactional
    public JwtResponse register(RegisterRequest request) {
        if (request.getNom() == null || request.getNom().isBlank()) {
            throw new RuntimeException("Le nom est obligatoire");
        }
        if (request.getPrenom() == null || request.getPrenom().isBlank()) {
            throw new RuntimeException("Le prénom est obligatoire");
        }
        if (request.getMotDePasse() == null || request.getMotDePasse().length() < 8) {
            throw new RuntimeException("Le mot de passe doit contenir au moins 8 caractères");
        }
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        Utilisateur utilisateur = Utilisateur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .avatar(request.getAvatar())
                .build();

        utilisateur = utilisateurRepository.save(utilisateur);
        String token = jwtUtil.generateToken(utilisateur);
        return buildJwtResponse(token, utilisateur);
    }

    public JwtResponse login(LoginRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.getMotDePasse(), utilisateur.getMotDePasse())) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        String token = jwtUtil.generateToken(utilisateur);
        return buildJwtResponse(token, utilisateur);
    }

    @Transactional
    public Map<String, String> forgotPassword(String email) {
        Map<String, String> response = new HashMap<>();

        // Always the same message (security — don't reveal if email exists)
        response.put("message", "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.");

        if (!utilisateurRepository.existsByEmail(email)) {
            // Demo mode: show link anyway for testing convenience
            if (!emailService.isConfigured()) {
                response.put("demoLink", null);
            }
            return response;
        }

        // Delete previous tokens for this email
        passwordResetTokenRepository.deleteByEmail(email);

        // Generate new token (1h validity)
        String token = UUID.randomUUID().toString();
        PasswordResetToken prt = PasswordResetToken.builder()
                .token(token)
                .email(email)
                .expiration(LocalDateTime.now().plusHours(1))
                .utilise(false)
                .build();
        passwordResetTokenRepository.save(prt);

        // Send email — if it fails, return the link directly so user can still reset
        boolean emailSent = emailService.envoyerReinitialisationMdp(email, token);

        if (!emailSent) {
            response.put("message", "Email non disponible. Utilisez le lien ci-dessous pour réinitialiser :");
            response.put("demoLink", emailService.getFrontendUrl() + "/reset-password?token=" + token);
        }

        return response;
    }

    @Transactional
    public void resetPassword(String token, String nouveauMotDePasse) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Lien invalide ou expiré"));

        if (prt.isUtilise()) {
            throw new RuntimeException("Ce lien a déjà été utilisé");
        }

        if (prt.getExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Ce lien a expiré (valable 1 heure)");
        }

        Utilisateur u = utilisateurRepository.findByEmail(prt.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        u.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        utilisateurRepository.save(u);

        prt.setUtilise(true);
        passwordResetTokenRepository.save(prt);
    }

    private JwtResponse buildJwtResponse(String token, Utilisateur u) {
        return JwtResponse.builder()
                .token(token)
                .type("Bearer")
                .id(u.getId())
                .email(u.getEmail())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .avatar(u.getAvatar())
                .build();
    }
}
