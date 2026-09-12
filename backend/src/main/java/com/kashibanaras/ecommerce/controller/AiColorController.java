package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.AiColorPreview;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.entity.enums.AiPreviewStatus;
import com.kashibanaras.ecommerce.repository.AiColorPreviewRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.repository.UserRepository;
import com.kashibanaras.ecommerce.service.ai.CloudinaryImageStorage;
import com.kashibanaras.ecommerce.service.ai.LocalColorPreviewService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiColorController {

    private final ProductRepository products;
    private final UserRepository users;
    private final AiColorPreviewRepository previews;
    private final LocalColorPreviewService colorPreviewService;
    private final CloudinaryImageStorage cloudinaryStorage;
    private final boolean enabled;

    private final HttpClient httpClient =
            HttpClient.newBuilder()
                    .connectTimeout(
                            Duration.ofSeconds(20)
                    )
                    .followRedirects(
                            HttpClient.Redirect.NORMAL
                    )
                    .build();

    public AiColorController(
            ProductRepository products,
            UserRepository users,
            AiColorPreviewRepository previews,
            LocalColorPreviewService colorPreviewService,
            CloudinaryImageStorage cloudinaryStorage,
            @Value("${app.ai.color-preview-enabled:true}")
            boolean enabled
    ) {

        this.products = products;
        this.users = users;
        this.previews = previews;
        this.colorPreviewService = colorPreviewService;
        this.cloudinaryStorage = cloudinaryStorage;
        this.enabled = enabled;
    }

    record Req(
            Long productId,
            String hex,
            String colorName,
            String imageUrl
    ) {
    }

    @PostMapping(
            value = "/color-preview",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ApiResponse<?> preview(
            Authentication authentication,
            @RequestBody Req request
    ) {

        if (!enabled) {
            return ApiResponse.error(
                    "AI Color Studio is disabled"
            );
        }

        /*
         * User ID comes from the JWT authentication.
         */
        if (authentication == null
                || authentication.getCredentials() == null) {

            return ApiResponse.error(
                    "Login is required"
            );
        }

        Long userId;

        try {

            userId =
                    Long.valueOf(
                            authentication
                                    .getCredentials()
                                    .toString()
                    );

        } catch (Exception e) {

            return ApiResponse.error(
                    "Unable to identify logged-in user"
            );
        }

        if (request.productId() == null) {

            return ApiResponse.error(
                    "Product ID is required"
            );
        }

        if (request.hex() == null
                || !request.hex().matches(
                "#[0-9a-fA-F]{6}"
        )) {

            return ApiResponse.error(
                    "A valid HEX color is required"
            );
        }

        /*
         * Always load the product from DB.
         *
         * We intentionally do NOT trust imageUrl coming
         * from the frontend.
         */
        Product product =
                products.findById(
                        request.productId()
                ).orElseThrow(
                        () -> new IllegalArgumentException(
                                "Product not found"
                        )
                );

        if (!product.isActive()) {

            return ApiResponse.error(
                    "Product is not active"
            );
        }

        if (product.getImages() == null
                || product.getImages().isEmpty()) {

            return ApiResponse.error(
                    "Product image is not available"
            );
        }

        String originalImageUrl =
                product.getImages()
                        .stream()
                        .filter(image -> image != null)
                        .map(image -> image.getUrl())
                        .filter(url ->
                                url != null
                                        && !url.isBlank()
                        )
                        .findFirst()
                        .orElse(null);

        if (originalImageUrl == null) {

            return ApiResponse.error(
                    "Product image URL is not available"
            );
        }

        User user =
                users.findById(userId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "User not found"
                                )
                        );

        String requestedColorName =
                request.colorName() == null
                        || request.colorName().isBlank()
                        ? "Custom"
                        : request.colorName().trim();

        /*
         * Save preview request in database.
         */
        AiColorPreview preview =
                AiColorPreview.builder()
                        .user(user)
                        .product(product)
                        .originalImageUrl(
                                originalImageUrl
                        )
                        .requestedHex(
                                request.hex().toUpperCase()
                        )
                        .requestedColorName(
                                requestedColorName
                        )
                        .aiProvider("local")
                        .status(
                                AiPreviewStatus.PROCESSING
                        )
                        .build();

        preview =
                previews.save(preview);

        try {

            /*
             * Download the ORIGINAL product image.
             */
            byte[] originalImage =
                    downloadImage(
                            originalImageUrl
                    );

            if (originalImage.length == 0) {

                throw new IllegalStateException(
                        "Downloaded product image is empty"
                );
            }

            /*
             * Local recolouring.
             *
             * This does not generate a new photograph.
             * It edits the original pixels.
             */
            byte[] generatedImage =
                    colorPreviewService.recolor(
                            originalImage,
                            request.hex()
                    );

            if (generatedImage == null
                    || generatedImage.length == 0) {

                throw new IllegalStateException(
                        "Generated image is empty"
                );
            }

            /*
             * IMPORTANT:
             *
             * DO NOT write generatedImage to:
             *
             * uploads/ai-previews
             *
             * Upload it directly to Cloudinary.
             */
            String generatedUrl =
                    cloudinaryStorage.uploadGeneratedImage(
                            generatedImage,
                            product.getId(),
                            user.getId()
                    );

            /*
             * Save Cloudinary URL in DB.
             */
            preview.setGeneratedImageUrl(
                    generatedUrl
            );

            preview.setStatus(
                    AiPreviewStatus.COMPLETED
            );

            preview.setErrorMessage(null);

            previews.save(preview);

            Map<String, Object> response =
                    new LinkedHashMap<>();

            response.put(
                    "id",
                    preview.getId()
            );

            response.put(
                    "status",
                    "COMPLETED"
            );

            response.put(
                    "productId",
                    product.getId()
            );

            response.put(
                    "requestedHex",
                    request.hex().toUpperCase()
            );

            response.put(
                    "requestedColorName",
                    requestedColorName
            );

            response.put(
                    "originalImageUrl",
                    originalImageUrl
            );

            /*
             * This is now the REAL Cloudinary HTTPS URL.
             */
            response.put(
                    "generatedImageUrl",
                    generatedUrl
            );

            response.put(
                    "previewUrl",
                    generatedUrl
            );

            response.put(
                    "provider",
                    "local"
            );

            return ApiResponse.success(
                    "Color preview generated",
                    response
            );

        } catch (Exception e) {

            preview.setStatus(
                    AiPreviewStatus.FAILED
            );

            preview.setErrorMessage(
                    safeMessage(e)
            );

            previews.save(preview);

            return ApiResponse.error(
                    "Unable to generate color preview: "
                            + safeMessage(e)
            );
        }
    }

    private byte[] downloadImage(
            String imageUrl
    ) {

        try {

            URI uri =
                    URI.create(imageUrl);

            String scheme =
                    uri.getScheme();

            if (!"http".equalsIgnoreCase(scheme)
                    && !"https".equalsIgnoreCase(scheme)) {

                throw new IllegalArgumentException(
                        "Product image must use HTTP or HTTPS"
                );
            }

            HttpRequest httpRequest =
                    HttpRequest.newBuilder()
                            .uri(uri)
                            .timeout(
                                    Duration.ofSeconds(60)
                            )
                            .header(
                                    "User-Agent",
                                    "Kashi-Banaras-AI-Color-Studio"
                            )
                            .GET()
                            .build();

            HttpResponse<byte[]> response =
                    httpClient.send(
                            httpRequest,
                            HttpResponse.BodyHandlers
                                    .ofByteArray()
                    );

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {

                throw new IllegalStateException(
                        "Unable to download product image. HTTP "
                                + response.statusCode()
                );
            }

            byte[] data =
                    response.body();

            if (data == null
                    || data.length == 0) {

                throw new IllegalStateException(
                        "Product image response is empty"
                );
            }

            String contentType =
                    response.headers()
                            .firstValue(
                                    "content-type"
                            )
                            .orElse("image/jpeg");

            if (!contentType
                    .toLowerCase()
                    .startsWith("image/")) {

                throw new IllegalStateException(
                        "Product URL did not return an image"
                );
            }

            return data;

        } catch (IllegalArgumentException e) {

            throw e;

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Unable to download product image",
                    e
            );
        }
    }

    private String safeMessage(
            Exception e
    ) {

        String message =
                e.getMessage();

        if (message == null
                || message.isBlank()) {

            return "AI color generation failed";
        }

        return message.length() > 500
                ? message.substring(0, 500)
                : message;
    }
}