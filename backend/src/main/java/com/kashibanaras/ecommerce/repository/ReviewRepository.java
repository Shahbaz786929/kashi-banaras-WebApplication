package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    org.springframework.data.domain.Page<Review> findByProductIdAndApprovedTrue(Long productId, org.springframework.data.domain.Pageable pageable);
    boolean existsByProductIdAndUserId(Long productId, Long userId);
}
