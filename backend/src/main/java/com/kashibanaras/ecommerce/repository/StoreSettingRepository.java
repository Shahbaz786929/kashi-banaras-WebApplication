package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.StoreSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingRepository extends JpaRepository<StoreSetting, Long> {
    java.util.Optional<StoreSetting> findBySettingKey(String key);
}
