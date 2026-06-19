package com.planitask.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter @Setter
public class JwtConfig {

    private String secret = "planitask_super_secret_key_2026_jwt_auth_token_minimum_256_bits_required";
    private long expiration = 86400000L;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
