package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "user",
            "shippingAddress",
            "billingAddress",
            "items",
            "items.product",
            "items.product.images"
    })
    List<Order> findAll();

    @Override
    @EntityGraph(attributePaths = {
            "user",
            "shippingAddress",
            "billingAddress",
            "items",
            "items.product",
            "items.product.images"
    })
    Optional<Order> findById(Long id);

    Optional<Order> findByOrderNumber(String orderNumber);

    org.springframework.data.domain.Page<Order> findByUserId(
            Long userId,
            org.springframework.data.domain.Pageable pageable
    );

    org.springframework.data.domain.Page<Order> findByStatus(
            com.kashibanaras.ecommerce.entity.enums.OrderStatus status,
            org.springframework.data.domain.Pageable pageable
    );
}