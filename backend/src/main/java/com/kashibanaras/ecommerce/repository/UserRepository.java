package com.kashibanaras.ecommerce.repository;
import com.kashibanaras.ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email); boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
        @Query(value = """
                        SELECT COUNT(DISTINCT customer_roles.user_id)
                        FROM user_roles customer_roles
                        JOIN roles customer_role
                            ON customer_role.id = customer_roles.role_id
                        WHERE customer_role.name = 'ROLE_CUSTOMER'
                            AND NOT EXISTS (
                                    SELECT 1
                                    FROM user_roles admin_roles
                                    JOIN roles admin_role
                                        ON admin_role.id = admin_roles.role_id
                                    WHERE admin_roles.user_id = customer_roles.user_id
                                        AND admin_role.name = 'ROLE_ADMIN'
                            )
                        """, nativeQuery = true)
        long countCustomers();
}
