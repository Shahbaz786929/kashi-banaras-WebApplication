package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    java.util.Optional<Category> findBySlug(String slug);
    java.util.List<Category> findByActiveTrue();
}
