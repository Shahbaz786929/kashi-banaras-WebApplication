package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.HomeBanner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HomeBannerRepository extends JpaRepository<HomeBanner, Long> {

    List<HomeBanner> findByActiveTrueOrderBySortOrderAsc();

    List<HomeBanner> findAllByOrderBySortOrderAsc();
}