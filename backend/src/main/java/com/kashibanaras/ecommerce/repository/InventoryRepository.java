package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    java.util.Optional<Inventory> findByProductId(Long productId);
    java.util.List<Inventory> findByStockQuantityLessThanEqual(Integer threshold);
}
