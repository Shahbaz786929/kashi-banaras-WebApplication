package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.entity.Collection;
import com.kashibanaras.ecommerce.entity.HomeBanner;
import com.kashibanaras.ecommerce.repository.CollectionRepository;
import com.kashibanaras.ecommerce.repository.HomeBannerRepository;
import com.kashibanaras.ecommerce.service.ai.CloudinaryImageStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/home")
@RequiredArgsConstructor
public class AdminHomeController {

    private final HomeBannerRepository bannerRepository;
    private final CollectionRepository collectionRepository;
    private final CloudinaryImageStorage cloudinaryImageStorage;

    // =========================
    // BANNERS
    // =========================

    @GetMapping("/banners")
    public ResponseEntity<?> getBanners() {
        return ResponseEntity.ok(
                bannerRepository.findAllByOrderBySortOrderAsc()
        );
    }

    @PostMapping(
            value = "/banners",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> createBanner(
            @RequestParam(required = false) String smallHeading,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String buttonText,
            @RequestParam(required = false) String buttonLink,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestParam(defaultValue = "0") Integer sortOrder,
            @RequestPart MultipartFile image
    ) {

        try {

            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Banner image is required");
            }

            byte[] bytes = image.getBytes();

            String imageUrl =
                    cloudinaryImageStorage.uploadHomeImage(bytes, "banners");

            HomeBanner banner = HomeBanner.builder()
                    .smallHeading(smallHeading)
                    .title(title)
                    .description(description)
                    .buttonText(buttonText)
                    .buttonLink(buttonLink)
                    .imageUrl(imageUrl)
                    .active(active)
                    .sortOrder(sortOrder)
                    .build();

            return ResponseEntity.ok(
                    bannerRepository.save(banner)
            );

        } catch (Exception e) {

            return ResponseEntity.internalServerError()
                    .body("Failed to create banner: " + e.getMessage());
        }
    }

    @PutMapping(
            value = "/banners/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> updateBanner(
            @PathVariable Long id,
            @RequestParam(required = false) String smallHeading,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String buttonText,
            @RequestParam(required = false) String buttonLink,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestParam(defaultValue = "0") Integer sortOrder,
            @RequestPart(required = false) MultipartFile image
    ) {

        return bannerRepository.findById(id)
                .map(existing -> {

                    try {

                        existing.setSmallHeading(smallHeading);
                        existing.setTitle(title);
                        existing.setDescription(description);
                        existing.setButtonText(buttonText);
                        existing.setButtonLink(buttonLink);
                        existing.setActive(active);
                        existing.setSortOrder(sortOrder);

                        if (image != null && !image.isEmpty()) {

                            String imageUrl =
                                    cloudinaryImageStorage.uploadHomeImage(
                                            image.getBytes(),
                                            "banners"
                                    );

                            existing.setImageUrl(imageUrl);
                        }

                        return ResponseEntity.ok(
                                bannerRepository.save(existing)
                        );

                    } catch (Exception e) {

                        return ResponseEntity.internalServerError()
                                .body("Failed to update banner: " + e.getMessage());
                    }

                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    @DeleteMapping("/banners/{id}")
    public ResponseEntity<?> deleteBanner(@PathVariable Long id) {

        if (!bannerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        bannerRepository.deleteById(id);

        return ResponseEntity.ok("Banner deleted successfully");
    }

    @PatchMapping("/banners/{id}/status")
    public ResponseEntity<?> updateBannerStatus(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return bannerRepository.findById(id)
                .map(banner -> {

                    banner.setActive(active);

                    return ResponseEntity.ok(
                            bannerRepository.save(banner)
                    );

                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // =========================
    // COLLECTIONS
    // =========================

    @GetMapping("/collections")
    public ResponseEntity<List<Collection>> getCollections() {

        return ResponseEntity.ok(
                collectionRepository.findAllByOrderBySortOrderAsc()
        );
    }

    @PostMapping(
            value = "/collections",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> createCollection(
            @RequestParam String name,
            @RequestParam String slug,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String buttonText,
            @RequestParam(required = false) String buttonLink,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestParam(defaultValue = "0") Integer sortOrder,
            @RequestPart(required = false) MultipartFile image
    ) {

        try {

            if (collectionRepository.existsBySlug(slug)) {
                return ResponseEntity.badRequest()
                        .body("Collection slug already exists");
            }

            String imageUrl = null;

            if (image != null && !image.isEmpty()) {

                imageUrl =
                        cloudinaryImageStorage.uploadHomeImage(
                                image.getBytes(),
                                "collections"
                        );
            }

            Collection collection = Collection.builder()
                    .name(name)
                    .slug(slug)
                    .description(description)
                    .buttonText(
                            buttonText == null || buttonText.isBlank()
                                    ? "SHOP NOW"
                                    : buttonText
                    )
                    .buttonLink(buttonLink)
                    .imageUrl(imageUrl)
                    .active(active)
                    .sortOrder(sortOrder)
                    .build();

            return ResponseEntity.ok(
                    collectionRepository.save(collection)
            );

        } catch (Exception e) {

            return ResponseEntity.internalServerError()
                    .body("Failed to create collection: " + e.getMessage());
        }
    }

    @PutMapping(
            value = "/collections/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> updateCollection(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam String slug,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String buttonText,
            @RequestParam(required = false) String buttonLink,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestParam(defaultValue = "0") Integer sortOrder,
            @RequestPart(required = false) MultipartFile image
    ) {

        return collectionRepository.findById(id)
                .map(existing -> {

                    try {

                        if (!existing.getSlug().equals(slug)
                                && collectionRepository.existsBySlug(slug)) {

                            return ResponseEntity.badRequest()
                                    .body("Collection slug already exists");
                        }

                        existing.setName(name);
                        existing.setSlug(slug);
                        existing.setDescription(description);
                        existing.setButtonText(
                                buttonText == null || buttonText.isBlank()
                                        ? "SHOP NOW"
                                        : buttonText
                        );
                        existing.setButtonLink(buttonLink);
                        existing.setActive(active);
                        existing.setSortOrder(sortOrder);

                        if (image != null && !image.isEmpty()) {

                            String imageUrl =
                                    cloudinaryImageStorage.uploadHomeImage(
                                            image.getBytes(),
                                            "collections"
                                    );

                            existing.setImageUrl(imageUrl);
                        }

                        return ResponseEntity.ok(
                                collectionRepository.save(existing)
                        );

                    } catch (Exception e) {

                        return ResponseEntity.internalServerError()
                                .body("Failed to update collection: "
                                        + e.getMessage());
                    }

                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    @DeleteMapping("/collections/{id}")
    public ResponseEntity<?> deleteCollection(@PathVariable Long id) {

        if (!collectionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        collectionRepository.deleteById(id);

        return ResponseEntity.ok(
                "Collection deleted successfully"
        );
    }

    @PatchMapping("/collections/{id}/status")
    public ResponseEntity<?> updateCollectionStatus(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return collectionRepository.findById(id)
                .map(collection -> {

                    collection.setActive(active);

                    return ResponseEntity.ok(
                            collectionRepository.save(collection)
                    );

                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }
}