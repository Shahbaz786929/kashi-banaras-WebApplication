package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, Long> {
    java.util.Optional<Cart> findByUserId(Long userId);
}
