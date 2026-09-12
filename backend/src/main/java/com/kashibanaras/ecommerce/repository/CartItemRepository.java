package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCartId(Long cartId);

    Optional<CartItem> findByCartIdAndProductIdAndProductColorId(
            Long cartId,
            Long productId,
            Long productColorId
    );
}