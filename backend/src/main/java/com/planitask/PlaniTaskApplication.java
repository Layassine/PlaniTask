package com.planitask;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.planitask.config.JwtConfig;

@SpringBootApplication
@EnableConfigurationProperties(JwtConfig.class)
public class PlaniTaskApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlaniTaskApplication.class, args);
    }
}
