package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, Long> {
    java.util.List<Address> findByUserId(Long userId);
}
