package com.kashibanaras.ecommerce.repository;

import com.kashibanaras.ecommerce.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    java.util.List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
}
