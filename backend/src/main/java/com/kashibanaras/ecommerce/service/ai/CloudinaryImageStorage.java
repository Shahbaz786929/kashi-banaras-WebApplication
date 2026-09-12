package com.kashibanaras.ecommerce.service.ai;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CloudinaryImageStorage {

    private final Cloudinary cloudinary;

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryImageStorage(
            @Value("${app.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.cloudinary.api-key:}") String apiKey,
            @Value("${app.cloudinary.api-secret:}") String apiSecret
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;

        this.cloudinary = new Cloudinary(
                ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret,
                        "secure", true
                )
        );
    }

    /*
     * =========================================================
     * AI GENERATED IMAGE
     * =========================================================
     */

    public String uploadGeneratedImage(
            byte[] imageBytes,
            Long productId,
            Long userId
    ) {

        validateCredentials();

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException(
                    "Generated image is empty"
            );
        }

        try {

            String publicId =
                    "product-" + productId
                            + "-user-" + userId
                            + "-" + System.currentTimeMillis();

            Map<?, ?> result =
                    cloudinary.uploader().upload(
                            imageBytes,
                            ObjectUtils.asMap(
                                    "resource_type", "image",
                                    "folder",
                                    "kashi-banaras/ai-color-previews",
                                    "public_id",
                                    publicId,
                                    "overwrite",
                                    false,
                                    "unique_filename",
                                    false,
                                    "format",
                                    "png"
                            )
                    );

            return getSecureUrl(result);

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Failed to upload generated image to Cloudinary",
                    e
            );
        }
    }

    /*
     * =========================================================
     * HOMEPAGE IMAGE
     * =========================================================
     *
     * Used by:
     *
     * AdminHomeController
     *
     * Example:
     *
     * uploadHomeImage(bytes, "banners")
     * uploadHomeImage(bytes, "collections")
     *
     * Images are stored in:
     *
     * kashi-banaras/home/banners
     * kashi-banaras/home/collections
     */

    public String uploadHomeImage(
            byte[] imageBytes,
            String folder
    ) {

        validateCredentials();

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException(
                    "Home image is empty"
            );
        }

        String safeFolder =
                folder == null || folder.isBlank()
                        ? "general"
                        : folder.trim()
                        .toLowerCase()
                        .replaceAll("[^a-z0-9_-]", "-");

        try {

            String publicId =
                    "home-"
                            + System.currentTimeMillis()
                            + "-"
                            + System.nanoTime();

            Map<?, ?> result =
                    cloudinary.uploader().upload(
                            imageBytes,
                            ObjectUtils.asMap(
                                    "resource_type", "image",
                                    "folder",
                                    "kashi-banaras/home/"
                                            + safeFolder,
                                    "public_id",
                                    publicId,
                                    "overwrite",
                                    false,
                                    "unique_filename",
                                    false
                            )
                    );

            return getSecureUrl(result);

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Failed to upload homepage image to Cloudinary",
                    e
            );
        }
    }

    /*
     * =========================================================
     * PRODUCT IMAGE
     * =========================================================
     *
     * Used by AdminProductController.
     *
     * Images are stored in:
     *
     * kashi-banaras/products/{productId}
     */

    public String uploadProductImage(
            byte[] imageBytes,
            Long productId,
            Integer sortOrder
    ) {

        validateCredentials();

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException(
                    "Product image is empty"
            );
        }

        if (productId == null) {
            throw new IllegalArgumentException(
                    "Product ID is required"
            );
        }

        try {

            int order =
                    sortOrder == null
                            ? 0
                            : Math.max(0, sortOrder);

            String publicId =
                    "product-"
                            + productId
                            + "-image-"
                            + order
                            + "-"
                            + System.currentTimeMillis();

            Map<?, ?> result =
                    cloudinary.uploader().upload(
                            imageBytes,
                            ObjectUtils.asMap(
                                    "resource_type", "image",
                                    "folder",
                                    "kashi-banaras/products/"
                                            + productId,
                                    "public_id",
                                    publicId,
                                    "overwrite",
                                    false,
                                    "unique_filename",
                                    false
                            )
                    );

            return getSecureUrl(result);

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Failed to upload product image to Cloudinary",
                    e
            );
        }
    }

    /*
     * =========================================================
     * COMMON VALIDATION
     * =========================================================
     */

    private void validateCredentials() {

        if (cloudName == null
                || cloudName.isBlank()
                || apiKey == null
                || apiKey.isBlank()
                || apiSecret == null
                || apiSecret.isBlank()) {

            throw new IllegalStateException(
                    "Cloudinary credentials are not configured"
            );
        }
    }

    /*
     * =========================================================
     * SECURE URL
     * =========================================================
     */

    private String getSecureUrl(
            Map<?, ?> result
    ) {

        Object secureUrl =
                result.get("secure_url");

        if (secureUrl == null
                || secureUrl.toString().isBlank()) {

            throw new IllegalStateException(
                    "Cloudinary did not return a secure URL"
            );
        }

        return secureUrl.toString();
    }
}