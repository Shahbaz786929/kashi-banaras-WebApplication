package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.Category;
import com.kashibanaras.ecommerce.repository.CategoryRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.service.ai.CloudinaryImageStorage;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final CloudinaryImageStorage cloudinaryImageStorage;

    public AdminCategoryController(
            CategoryRepository categories,
            ProductRepository products,
            CloudinaryImageStorage cloudinaryImageStorage
    ) {
        this.categories = categories;
        this.products = products;
        this.cloudinaryImageStorage = cloudinaryImageStorage;
    }

    @GetMapping
    public ApiResponse<List<Category>> all() {
        return ApiResponse.success(
                "Categories",
                categories.findAll()
        );
    }

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<Category> create(
            @RequestParam String name,
            @RequestParam String slug,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestPart(required = false) MultipartFile image
    ) {
        try {
            String trimmedName = blankToNull(name);
            String trimmedSlug = normalizeSlug(slug);

            if (trimmedName == null) {
                return ApiResponse.error(
                        "Category name is required."
                );
            }

            if (trimmedSlug == null) {
                return ApiResponse.error(
                        "Category slug is required."
                );
            }

            if (categories.findBySlug(trimmedSlug).isPresent()) {
                return ApiResponse.error(
                        "Category slug already exists."
                );
            }

            String imageUrl =
                    uploadCategoryImage(image);

            Category category = Category.builder()
                    .name(trimmedName)
                    .slug(trimmedSlug)
                    .description(
                            blankToNull(description)
                    )
                    .imageUrl(imageUrl)
                    .active(active)
                    .build();

            return ApiResponse.success(
                    "Category created successfully",
                    categories.save(category)
            );

        } catch (IllegalArgumentException e) {
            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {
            return ApiResponse.error(
                    "Unable to create category: "
                            + safeMessage(e)
            );
        }
    }

    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<Category> update(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam String slug,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestPart(required = false) MultipartFile image
    ) {
        try {
            Category existing =
                    categories.findById(id)
                            .orElseThrow(
                                    () -> new IllegalArgumentException(
                                            "Category not found."
                                    )
                            );

            String trimmedName =
                    blankToNull(name);

            String trimmedSlug =
                    normalizeSlug(slug);

            if (trimmedName == null) {
                return ApiResponse.error(
                        "Category name is required."
                );
            }

            if (trimmedSlug == null) {
                return ApiResponse.error(
                        "Category slug is required."
                );
            }

            categories.findBySlug(trimmedSlug)
                    .ifPresent(candidate -> {
                        if (!candidate
                                .getId()
                                .equals(id)) {

                            throw new IllegalArgumentException(
                                    "Category slug already exists."
                            );
                        }
                    });

            existing.setName(trimmedName);
            existing.setSlug(trimmedSlug);
            existing.setDescription(
                    blankToNull(description)
            );
            existing.setActive(active);

            String uploadedImage =
                    uploadCategoryImage(image);

            if (uploadedImage != null) {
                existing.setImageUrl(
                        uploadedImage
                );
            }

            return ApiResponse.success(
                    "Category updated successfully",
                    categories.save(existing)
            );

        } catch (IllegalArgumentException e) {
            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {
            return ApiResponse.error(
                    "Unable to update category: "
                            + safeMessage(e)
            );
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id
    ) {
        try {
            Category category =
                    categories.findById(id)
                            .orElseThrow(
                                    () -> new IllegalArgumentException(
                                            "Category not found."
                                    )
                            );

            /*
             * A product currently references this category.
             *
             * We intentionally do NOT delete the category because
             * products.category_id has a foreign-key constraint.
             *
             * Admin should deactivate the category instead.
             */
            if (products.existsByCategoryId(id)) {
                return ApiResponse.error(
                        "This category is being used by existing products and cannot be permanently deleted. Deactivate the category instead."
                );
            }

            categories.delete(category);

            return ApiResponse.success(
                    "Category deleted successfully",
                    null
            );

        } catch (IllegalArgumentException e) {
            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {
            return ApiResponse.error(
                    "Unable to delete category: "
                            + safeMessage(e)
            );
        }
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Category> status(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {
        try {
            Category category =
                    categories.findById(id)
                            .orElseThrow(
                                    () -> new IllegalArgumentException(
                                            "Category not found."
                                    )
                            );

            category.setActive(active);

            return ApiResponse.success(
                    "Category status updated",
                    categories.save(category)
            );

        } catch (IllegalArgumentException e) {
            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {
            return ApiResponse.error(
                    "Unable to update category status: "
                            + safeMessage(e)
            );
        }
    }

    private String uploadCategoryImage(
            MultipartFile image
    ) {
        if (image == null || image.isEmpty()) {
            return null;
        }

        if (image.getSize() >
                10L * 1024L * 1024L) {

            throw new IllegalArgumentException(
                    "Category image must be 10MB or smaller."
            );
        }

        String contentType =
                image.getContentType();

        if (contentType == null ||
                !contentType
                        .toLowerCase()
                        .startsWith("image/")) {

            throw new IllegalArgumentException(
                    "Only image files are allowed."
            );
        }

        try {
            return cloudinaryImageStorage.uploadHomeImage(
                    image.getBytes(),
                    "categories"
            );

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to read category image bytes.",
                    e
            );
        }
    }

    private String normalizeSlug(
            String slug
    ) {
        String trimmed =
                blankToNull(slug);

        if (trimmed == null) {
            return null;
        }

        String normalized =
                trimmed
                        .trim()
                        .toLowerCase(Locale.ROOT);

        return normalized.isBlank()
                ? null
                : normalized;
    }

    private String blankToNull(
            String value
    ) {
        if (value == null ||
                value.isBlank()) {

            return null;
        }

        return value.trim();
    }

    private String safeMessage(
            Exception e
    ) {
        String message =
                e.getMessage();

        if (message == null ||
                message.isBlank()) {

            return "server error";
        }

        return message.length() > 250
                ? message.substring(0, 250)
                : message;
    }
}