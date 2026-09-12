package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    java.util.List<WishlistItem> findByWishlistId(Long wishlistId);
    java.util.Optional<WishlistItem> findByWishlistIdAndProductId(Long wishlistId, Long productId);
}
