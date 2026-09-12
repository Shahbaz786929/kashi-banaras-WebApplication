package com.kashibanaras.ecommerce.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Entity
@Table(name = "product_colors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductColor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(name = "color_name", nullable = false, length = 80)
    private String colorName;

    @Column(name = "hex_code", nullable = false, length = 7)
    private String hexCode;

    @Column(name = "swatch_image_url", length = 500)
    private String swatchImageUrl;
}
