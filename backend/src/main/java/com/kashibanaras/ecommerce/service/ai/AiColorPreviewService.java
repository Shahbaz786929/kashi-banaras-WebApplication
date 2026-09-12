package com.kashibanaras.ecommerce.service.ai;

import com.kashibanaras.ecommerce.entity.AiColorPreview;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.entity.ProductImage;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.entity.enums.AiPreviewStatus;
import com.kashibanaras.ecommerce.repository.AiColorPreviewRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class AiColorPreviewService {

    private final ProductRepository products;
    private final UserRepository users;
    private final AiColorPreviewRepository previews;
    private final LocalColorPreviewService colorPreviewService;
    private final CloudinaryImageStorage cloudinaryStorage;

    private final int maxImageSizeMb;

    private final HttpClient httpClient =
            HttpClient.newBuilder()
                    .connectTimeout(
                            Duration.ofSeconds(15)
                    )
                    .followRedirects(
                            HttpClient.Redirect.NORMAL
                    )
                    .build();

    public AiColorPreviewService(
            ProductRepository products,
            UserRepository users,
            AiColorPreviewRepository previews,
            LocalColorPreviewService colorPreviewService,
            CloudinaryImageStorage cloudinaryStorage,
            @Value("${app.ai.max-image-size-mb:12}")
            int maxImageSizeMb
    ) {
        this.products = products;
        this.users = users;
        this.previews = previews;
        this.colorPreviewService =
                colorPreviewService;
        this.cloudinaryStorage =
                cloudinaryStorage;
        this.maxImageSizeMb =
                maxImageSizeMb;
    }

    @Transactional
    public AiColorPreview createPreview(
            Long userId,
            Long productId,
            String hex,
            String colorName
    ) {

        validateHex(hex);

        User user =
                users.findById(userId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found"
                                )
                        );

        Product product =
                products.findById(productId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found"
                                )
                        );

        if (!product.isActive()) {
            throw new IllegalArgumentException(
                    "Product is not active"
            );
        }

        if (product.getImages() == null
                || product.getImages().isEmpty()) {
            throw new IllegalStateException(
                    "Product does not have an image"
            );
        }

        ProductImage originalImage =
                product.getImages()
                        .stream()
                        .filter(image ->
                                image != null
                                        && image.getUrl() != null
                                        && !image.getUrl().isBlank()
                        )
                        .findFirst()
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Product image URL is empty"
                                )
                        );

        String originalImageUrl =
                originalImage.getUrl();

        AiColorPreview preview =
                AiColorPreview.builder()
                        .user(user)
                        .product(product)
                        .originalImageUrl(
                                originalImageUrl
                        )
                        .requestedHex(
                                hex.toUpperCase()
                        )
                        .requestedColorName(
                                colorName == null
                                        || colorName.isBlank()
                                        ? "Custom Color"
                                        : colorName.trim()
                        )
                        .aiProvider("local-cloudinary")
                        .status(
                                AiPreviewStatus.PROCESSING
                        )
                        .build();

        preview =
                previews.save(preview);

        try {

            /*
             * Download original product image.
             */
            DownloadedImage image =
                    downloadImage(
                            originalImageUrl
                    );

            validateImageSize(
                    image.data()
            );

            /*
             * IMPORTANT:
             *
             * This method ONLY changes the fabric color.
             * It does NOT create a new AI image.
             *
             * Same:
             * - person
             * - background
             * - pose
             * - saree shape
             * - folds
             * - zari
             * - lighting
             *
             * are preserved from original image.
             */
            byte[] generatedImage =
                    colorPreviewService.recolor(
                            image.data(),
                            hex
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
             * Upload directly to Cloudinary.
             *
             * NO Files.write()
             * NO uploads/
             * NO local generated image.
             */
            String generatedUrl =
                    cloudinaryStorage
                            .uploadGeneratedImage(
                                    generatedImage,
                                    productId,
                                    userId
                            );

            if (generatedUrl == null
                    || generatedUrl.isBlank()) {
                throw new IllegalStateException(
                        "Cloudinary did not return image URL"
                );
            }

            preview.setGeneratedImageUrl(
                    generatedUrl
            );

            preview.setStatus(
                    AiPreviewStatus.COMPLETED
            );

            preview.setErrorMessage(null);

            return previews.save(preview);

        } catch (Exception e) {

            String message =
                    safeErrorMessage(e);

            preview.setStatus(
                    AiPreviewStatus.FAILED
            );

            preview.setErrorMessage(
                    message
            );

            previews.save(preview);

            throw new IllegalStateException(
                    message,
                    e
            );
        }
    }

    private DownloadedImage downloadImage(
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

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(uri)
                            .timeout(
                                    Duration.ofSeconds(45)
                            )
                            .header(
                                    "User-Agent",
                                    "Kashi-Banaras-Color-Studio"
                            )
                            .GET()
                            .build();

            HttpResponse<byte[]> response =
                    httpClient.send(
                            request,
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
                        "Downloaded product image is empty"
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

            return new DownloadedImage(
                    data,
                    contentType
                            .split(";")[0]
                            .trim()
            );

        } catch (IllegalArgumentException e) {

            throw e;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Product image download was interrupted",
                    e
            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Unable to download product image",
                    e
            );
        }
    }

    private void validateImageSize(
            byte[] data
    ) {

        long maxBytes =
                maxImageSizeMb
                        * 1024L
                        * 1024L;

        if (data.length > maxBytes) {

            throw new IllegalArgumentException(
                    "Product image exceeds "
                            + maxImageSizeMb
                            + " MB"
            );
        }
    }

    private void validateHex(
            String hex
    ) {

        if (hex == null
                || !hex.matches(
                "#[0-9a-fA-F]{6}"
        )) {

            throw new IllegalArgumentException(
                    "A valid HEX color is required"
            );
        }
    }

    private String safeErrorMessage(
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

    private record DownloadedImage(
            byte[] data,
            String mimeType
    ) {
    }
}