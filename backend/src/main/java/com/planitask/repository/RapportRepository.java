package com.planitask.repository;

import com.planitask.entity.Rapport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RapportRepository extends JpaRepository<Rapport, Long> {
    List<Rapport> findByProjetIdOrderByDateGenerationDesc(Long projetId);
}
