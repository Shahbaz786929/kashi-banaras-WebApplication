package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollectionRepository extends JpaRepository<Collection, Long> {

    List<Collection> findByActiveTrueOrderBySortOrderAsc();

    List<Collection> findAllByOrderBySortOrderAsc();

    Optional<Collection> findBySlug(String slug);

    boolean existsBySlug(String slug);
}