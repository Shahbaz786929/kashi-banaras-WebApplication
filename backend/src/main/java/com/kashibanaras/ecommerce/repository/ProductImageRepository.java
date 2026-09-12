package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    java.util.List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);
}
