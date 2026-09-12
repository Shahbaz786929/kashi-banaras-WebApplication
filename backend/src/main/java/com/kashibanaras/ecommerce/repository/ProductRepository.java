package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    Optional<Product> findBySlugAndActiveTrue(String slug);

    Optional<Product> findBySku(String sku);

    List<Product> findByActiveTrueOrderByIdDesc();

    List<Product> findByActiveTrueAndShowOnHomeTrueOrderByHomePositionAscIdAsc();

    List<Product> findByCollectionSlugAndActiveTrueOrderByIdDesc(
            String slug
    );

    boolean existsByCategoryId(Long categoryId);
}