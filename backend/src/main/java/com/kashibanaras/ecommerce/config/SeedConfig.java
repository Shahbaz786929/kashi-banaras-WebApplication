package com.kashibanaras.ecommerce.config;

import com.kashibanaras.ecommerce.entity.Category;
import com.kashibanaras.ecommerce.entity.Inventory;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.entity.ProductColor;
import com.kashibanaras.ecommerce.entity.Role;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.repository.CategoryRepository;
import com.kashibanaras.ecommerce.repository.InventoryRepository;
import com.kashibanaras.ecommerce.repository.ProductColorRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.repository.RoleRepository;
import com.kashibanaras.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Set;

@Configuration
public class SeedConfig {

 @Bean
 CommandLineRunner seed(
         @Value("${app.seed-data.enabled:false}") boolean enabled,
         RoleRepository rr,
         UserRepository ur,
         CategoryRepository cr,
         ProductRepository pr,
         InventoryRepository ir,
         ProductColorRepository pcr,
         PasswordEncoder enc
 ) {

  return args -> {

   // Seed data disabled - do nothing
   if (!enabled) {
    return;
   }

   // ---------------------------------------------------------
   // Create Roles
   // ---------------------------------------------------------

   Role customer = rr.findByName("ROLE_CUSTOMER")
           .orElseGet(() ->
                   rr.save(
                           Role.builder()
                                   .name("ROLE_CUSTOMER")
                                   .build()
                   )
           );

   Role admin = rr.findByName("ROLE_ADMIN")
           .orElseGet(() ->
                   rr.save(
                           Role.builder()
                                   .name("ROLE_ADMIN")
                                   .build()
                   )
           );

   // ---------------------------------------------------------
   // Create Admin User
   // ---------------------------------------------------------

   if (ur.findByEmail("admin@kashibanaras.dev").isEmpty()) {

    User adminUser = User.builder()
            .fullName("Kashi Admin")
            .email("admin@kashibanaras.dev")
            .passwordHash(
                    enc.encode(
                            System.getenv()
                                    .getOrDefault(
                                            "DEV_ADMIN_PASSWORD",
                                            "ChangeMe123!"
                                    )
                    )
            )
            .active(true)
            .emailVerified(true)
            .roles(Set.of(admin))
            .build();

    ur.save(adminUser);
   }

   // ---------------------------------------------------------
   // Create Demo Customer
   // ---------------------------------------------------------

   if (ur.findByEmail("customer@kashibanaras.dev").isEmpty()) {

    User customerUser = User.builder()
            .fullName("Demo Customer")
            .email("customer@kashibanaras.dev")
            .passwordHash(
                    enc.encode(
                            System.getenv()
                                    .getOrDefault(
                                            "DEV_CUSTOMER_PASSWORD",
                                            "ChangeMe123!"
                                    )
                    )
            )
            .active(true)
            .emailVerified(true)
            .roles(Set.of(customer))
            .build();

    ur.save(customerUser);
   }

   // ---------------------------------------------------------
   // Create Demo Products
   // ---------------------------------------------------------

   if (cr.count() == 0) {

    Category category = cr.save(
            Category.builder()
                    .name("Katan Silk")
                    .slug("katan-silk")
                    .description("Pure Banarasi Katan silk weaves")
                    .active(true)
                    .build()
    );

    String[] productNames = {
            "Katan Silk Banarasi Saree",
            "Royal Red Meenakari",
            "Emerald Zari Handloom",
            "Midnight Blue Kadhwa",
            "Wine Jangla Silk",
            "Ivory Pure Zari"
    };

    String[] prices = {
            "29999",
            "32999",
            "24999",
            "38999",
            "27999",
            "26999"
    };

    for (int i = 1; i <= 6; i++) {

     Product product = pr.save(
             Product.builder()
                     .sku("KB-DEMO-" + i)
                     .name(productNames[i - 1])
                     .slug("demo-saree-" + i)
                     .description(
                             "A premium handwoven Banarasi saree from Kashi Banaras."
                     )
                     .category(category)
                     .price(
                             new BigDecimal(prices[i - 1])
                     )
                     .fabric("Pure Banarasi Silk")
                     .weave("Handwoven")
                     .zariType("Pure Zari")
                     .occasion("Wedding")
                     .active(true)
                     .build()
     );

     // -------------------------------------------------
     // Inventory
     // -------------------------------------------------

     ir.save(
             Inventory.builder()
                     .product(product)
                     .stockQuantity(12 + i)
                     .lowStockThreshold(3)
                     .build()
     );

     // -------------------------------------------------
     // Product Color
     // -------------------------------------------------

     pcr.save(
             ProductColor.builder()
                     .product(product)
                     .colorName("Ivory White")
                     .hexCode("#F1EADC")
                     .build()
     );
    }
   }
  };
 }
}