package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.AiColorPreview;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiColorPreviewRepository extends JpaRepository<AiColorPreview, Long> {
    java.util.List<AiColorPreview> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndCreatedAtAfter(Long userId, java.time.LocalDateTime after);
}
