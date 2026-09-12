package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductColorRepository extends JpaRepository<ProductColor, Long> {
    java.util.List<ProductColor> findByProductId(Long productId);
}
