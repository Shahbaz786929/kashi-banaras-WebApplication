package com.kashibanaras.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            nullable = false,
            unique = true,
            length = 64
    )
    private String sku;

    @Column(
            nullable = false,
            length = 200
    )
    private String name;

    @Column(
            nullable = false,
            unique = true,
            length = 220
    )
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    /*
     * IMPORTANT
     *
     * EAGER is intentional here.
     *
     * Admin product response is converted to JSON after
     * repository operation. Lazy Category was previously
     * causing LazyInitializationException.
     */

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
            name = "category_id",
            nullable = false
    )
    @JsonIgnoreProperties({
            "hibernateLazyInitializer",
            "handler",
            "products"
    })
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "collection_id")
    @JsonIgnoreProperties({
            "hibernateLazyInitializer",
            "handler"
    })
    private Collection collection;

    @Column(
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal price;

    @Column(
            name = "discount_price",
            precision = 10,
            scale = 2
    )
    private BigDecimal discountPrice;

    @Column(
            length = 100
    )
    private String fabric;

    @Column(
            length = 100
    )
    private String weave;

    @Column(
            name = "zari_type",
            length = 100
    )
    private String zariType;

    @Column(
            length = 100
    )
    private String occasion;

    @Column(
            name = "is_active",
            nullable = false
    )
    @Builder.Default
    private boolean active = true;

    @Column(
            name = "seo_title",
            length = 200
    )
    private String seoTitle;

    @Column(
            name = "seo_description",
            length = 300
    )
    private String seoDescription;

    @Column(
            name = "seo_keywords",
            length = 300
    )
    private String seoKeywords;

    /*
     * =========================================================
     * HOMEPAGE PRODUCT MANAGEMENT
     * =========================================================
     */

    @Column(
            name = "show_on_home",
            nullable = false
    )
    @Builder.Default
    private boolean showOnHome = false;

    @Column(
            name = "home_position",
            nullable = false
    )
    @Builder.Default
    private Integer homePosition = 0;

    /*
     * =========================================================
     * IMAGES
     * =========================================================
     */

    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ProductImage> images =
            new ArrayList<>();

    /*
     * =========================================================
     * COLORS
     * =========================================================
     */

    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    @JsonIgnoreProperties({
            "hibernateLazyInitializer",
            "handler",
            "product"
    })
    @Builder.Default
    private List<ProductColor> colors =
            new ArrayList<>();

    /*
     * =========================================================
     * INVENTORY
     * =========================================================
     */

    @OneToOne(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    @JsonIgnoreProperties({
            "hibernateLazyInitializer",
            "handler",
            "product"
    })
    private Inventory inventory;

    /*
     * =========================================================
     * TIMESTAMPS
     * =========================================================
     */

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        LocalDateTime now =
                LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {

        updatedAt =
                LocalDateTime.now();
    }
}