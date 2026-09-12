package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    java.util.Optional<Coupon> findByCodeAndActiveTrue(String code);
}
