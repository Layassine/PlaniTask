package com.planitask.repository;

import com.planitask.entity.Jalon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JalonRepository extends JpaRepository<Jalon, Long> {

    List<Jalon> findByProjetId(Long projetId);

    long countByProjetId(Long projetId);

    long countByProjetIdAndAtteint(Long projetId, Boolean atteint);
}
