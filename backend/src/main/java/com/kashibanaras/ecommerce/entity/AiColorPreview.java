package com.kashibanaras.ecommerce.entity;

import com.kashibanaras.ecommerce.entity.enums.AiPreviewStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_color_previews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiColorPreview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "original_image_url", nullable = false, length = 500)
    private String originalImageUrl;

    @Column(name = "requested_hex", nullable = false, length = 7)
    private String requestedHex;

    @Column(name = "requested_color_name", length = 80)
    private String requestedColorName;

    @Column(name = "generated_image_url", length = 500)
    private String generatedImageUrl;

    @Column(name = "ai_provider", nullable = false, length = 50)
    @Builder.Default
    private String aiProvider = "gemini";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AiPreviewStatus status = AiPreviewStatus.PENDING;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }
}
