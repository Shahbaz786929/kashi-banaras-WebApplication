package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.Category;
import com.kashibanaras.ecommerce.entity.Collection;
import com.kashibanaras.ecommerce.entity.Inventory;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.entity.ProductImage;
import com.kashibanaras.ecommerce.entity.enums.ImageType;
import com.kashibanaras.ecommerce.repository.CategoryRepository;
import com.kashibanaras.ecommerce.repository.CollectionRepository;
import com.kashibanaras.ecommerce.repository.InventoryRepository;
import com.kashibanaras.ecommerce.repository.ProductImageRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.service.ai.CloudinaryImageStorage;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductRepository products;
    private final CategoryRepository categories;
        private final CollectionRepository collections;
    private final InventoryRepository inventoryRepository;
    private final ProductImageRepository productImageRepository;
    private final CloudinaryImageStorage cloudinaryStorage;

    public AdminProductController(
            ProductRepository products,
            CategoryRepository categories,
            CollectionRepository collections,
            InventoryRepository inventoryRepository,
            ProductImageRepository productImageRepository,
            CloudinaryImageStorage cloudinaryStorage
    ) {
        this.products = products;
        this.categories = categories;
        this.collections = collections;
        this.inventoryRepository = inventoryRepository;
        this.productImageRepository = productImageRepository;
        this.cloudinaryStorage = cloudinaryStorage;
    }

    public record ProductRequest(
            @NotBlank String sku,
            @NotBlank String name,
            @NotBlank String slug,
            String description,
            @NotNull Long categoryId,
            Long collectionId,
            @NotNull BigDecimal price,
            BigDecimal discountPrice,
            String fabric,
            String weave,
            String zariType,
            String occasion,
            Integer stock,
            Integer lowStockThreshold,
            String seoTitle,
            String seoDescription,
            String seoKeywords,
            Boolean showOnHome,
            Integer homePosition
    ) {
    }

    /*
     * =========================================================
     * GET ALL PRODUCTS
     * =========================================================
     */

    @GetMapping
    public ApiResponse<List<Product>> all() {

        return ApiResponse.success(
                "Products",
                products.findAll()
        );
    }

    /*
     * =========================================================
     * CREATE PRODUCT
     * =========================================================
     */

    @PostMapping
    public ApiResponse<Product> create(
            @Valid @RequestBody ProductRequest request
    ) {

        try {

            validateProductRequest(request);

            String sku = request.sku().trim();
            String slug = request.slug().trim();

            /*
             * Prevent duplicate SKU
             */

            if (products.findBySku(sku).isPresent()) {

                return ApiResponse.error(
                        "SKU already exists: " + sku
                );
            }

            /*
             * Prevent duplicate slug
             */

            if (products.findBySlug(slug).isPresent()) {

                return ApiResponse.error(
                        "Slug already exists: " + slug
                );
            }

            /*
             * Category must exist in database
             */

            Category category =
                    categories.findById(request.categoryId())
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Selected category was not found."
                                    )
                            );

            Collection collection = collectionFor(request.collectionId());

            /*
             * Create product
             */

            Product product = Product.builder()
                    .sku(sku)
                    .name(request.name().trim())
                    .slug(slug)
                    .description(
                            blankToNull(request.description())
                    )
                    .category(category)
                    .collection(collection)
                    .price(request.price())
                    .discountPrice(request.discountPrice())
                    .fabric(
                            blankToNull(request.fabric())
                    )
                    .weave(
                            blankToNull(request.weave())
                    )
                    .zariType(
                            blankToNull(request.zariType())
                    )
                    .occasion(
                            blankToNull(request.occasion())
                    )
                    .active(true)
                    .seoTitle(
                            blankToNull(request.seoTitle())
                    )
                    .seoDescription(
                            blankToNull(request.seoDescription())
                    )
                    .seoKeywords(
                            blankToNull(request.seoKeywords())
                    )
                    .showOnHome(
                            Boolean.TRUE.equals(
                                    request.showOnHome()
                            )
                    )
                    .homePosition(
                            request.homePosition() == null
                                    ? 0
                                    : Math.max(
                                    0,
                                    request.homePosition()
                            )
                    )
                    .build();

            Product saved =
                    products.save(product);

            /*
             * =================================================
             * INVENTORY
             * =================================================
             */

            Inventory inventory =
                    Inventory.builder()
                            .product(saved)
                            .stockQuantity(
                                    nonNegative(
                                            request.stock(),
                                            0
                                    )
                            )
                            .lowStockThreshold(
                                    nonNegative(
                                            request.lowStockThreshold(),
                                            3
                                    )
                            )
                            .build();

            Inventory savedInventory =
                    inventoryRepository.save(inventory);

            saved.setInventory(savedInventory);

            /*
             * IMPORTANT:
             *
             * Reload product after save.
             *
             * This makes sure category + inventory +
             * images are loaded correctly before JSON response.
             */

            Product result =
                    products.findById(saved.getId())
                            .orElseThrow(() ->
                                    new IllegalStateException(
                                            "Product was created but could not be reloaded."
                                    )
                            );

            return ApiResponse.success(
                    "Product created successfully",
                    result
            );

        } catch (DataIntegrityViolationException e) {

            return ApiResponse.error(
                    "Product could not be saved. SKU or slug may already exist."
            );

        } catch (IllegalArgumentException e) {

            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {

            return ApiResponse.error(
                    "Unable to create product: "
                            + safeMessage(e)
            );
        }
    }

    /*
     * =========================================================
     * UPDATE PRODUCT
     * =========================================================
     */

    @PutMapping("/{id}")
    public ApiResponse<Product> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {

        try {

            validateProductRequest(request);

            Product product =
                    products.findById(id)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Product not found."
                                    )
                            );

            String sku =
                    request.sku().trim();

            String slug =
                    request.slug().trim();

            /*
             * SKU uniqueness
             */

            products.findBySku(sku)
                    .ifPresent(existing -> {

                        if (!existing.getId().equals(id)) {

                            throw new IllegalArgumentException(
                                    "SKU already exists: " + sku
                            );
                        }
                    });

            /*
             * Slug uniqueness
             */

            products.findBySlug(slug)
                    .ifPresent(existing -> {

                        if (!existing.getId().equals(id)) {

                            throw new IllegalArgumentException(
                                    "Slug already exists: " + slug
                            );
                        }
                    });

            Category category =
                    categories.findById(
                            request.categoryId()
                    ).orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Selected category was not found."
                            )
                    );

            Collection collection = collectionFor(request.collectionId());

            product.setSku(sku);

            product.setName(
                    request.name().trim()
            );

            product.setSlug(slug);

            product.setDescription(
                    blankToNull(
                            request.description()
                    )
            );

            product.setCategory(category);
            product.setCollection(collection);

            product.setPrice(
                    request.price()
            );

            product.setDiscountPrice(
                    request.discountPrice()
            );

            product.setFabric(
                    blankToNull(
                            request.fabric()
                    )
            );

            product.setWeave(
                    blankToNull(
                            request.weave()
                    )
            );

            product.setZariType(
                    blankToNull(
                            request.zariType()
                    )
            );

            product.setOccasion(
                    blankToNull(
                            request.occasion()
                    )
            );

            product.setSeoTitle(
                    blankToNull(
                            request.seoTitle()
                    )
            );

            product.setSeoDescription(
                    blankToNull(
                            request.seoDescription()
                    )
            );

            product.setSeoKeywords(
                    blankToNull(
                            request.seoKeywords()
                    )
            );

            product.setShowOnHome(
                    Boolean.TRUE.equals(
                            request.showOnHome()
                    )
            );

            product.setHomePosition(
                    request.homePosition() == null
                            ? 0
                            : Math.max(
                            0,
                            request.homePosition()
                    )
            );

            Product saved =
                    products.save(product);

            /*
             * Update inventory
             */

            Inventory inventory =
                    inventoryRepository
                            .findByProductId(id)
                            .orElseGet(() ->
                                    Inventory.builder()
                                            .product(saved)
                                            .build()
                            );

            if (request.stock() != null) {

                inventory.setStockQuantity(
                        Math.max(
                                0,
                                request.stock()
                        )
                );
            }

            if (request.lowStockThreshold() != null) {

                inventory.setLowStockThreshold(
                        Math.max(
                                0,
                                request.lowStockThreshold()
                        )
                );
            }

            inventoryRepository.save(
                    inventory
            );

            /*
             * Reload after update
             */

            Product result =
                    products.findById(id)
                            .orElseThrow(() ->
                                    new IllegalStateException(
                                            "Product could not be reloaded after update."
                                    )
                            );

            return ApiResponse.success(
                    "Product updated successfully",
                    result
            );

        } catch (DataIntegrityViolationException e) {

            return ApiResponse.error(
                    "Product could not be updated. SKU or slug may already exist."
            );

        } catch (IllegalArgumentException e) {

            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {

            return ApiResponse.error(
                    "Unable to update product: "
                            + safeMessage(e)
            );
        }
    }

    /*
     * =========================================================
     * ACTIVE / INACTIVE
     * =========================================================
     */

    @PatchMapping("/{id}/status")
    public ApiResponse<Product> status(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        try {

            Product product =
                    products.findById(id)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Product not found."
                                    )
                            );

            product.setActive(active);

            Product saved =
                    products.save(product);

            return ApiResponse.success(
                    "Product status updated",
                    saved
            );

        } catch (IllegalArgumentException e) {

            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {

            return ApiResponse.error(
                    "Unable to update product status: "
                            + safeMessage(e)
            );
        }
    }

    /*
     * =========================================================
     * DELETE PRODUCT
     * =========================================================
     */

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id
    ) {

        try {

            Product product =
                    products.findById(id)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Product not found."
                                    )
                            );

            products.delete(product);

            return ApiResponse.success(
                    "Product deleted successfully",
                    null
            );

        } catch (DataIntegrityViolationException e) {

            return ApiResponse.error(
                    "Product could not be deleted because it is still referenced by existing carts, wishlists, or order history."
            );

        } catch (IllegalArgumentException e) {

            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {

            return ApiResponse.error(
                    "Unable to delete product: "
                            + safeMessage(e)
            );
        }
    }

    /*
     * =========================================================
     * HOMEPAGE PLACEMENT
     * =========================================================
     *
     * IMPORTANT:
     *
     * This endpoint ONLY changes:
     *
     * - showOnHome
     * - homePosition
     *
     * It does NOT touch:
     *
     * - name
     * - description
     * - price
     * - category
     * - fabric
     * - weave
     * - zari
     * - occasion
     * - SEO
     * - inventory
     * - images
     *
     * This prevents Admin Home from accidentally
     * deleting product information.
     */

    public record HomeProductRequest(
            Boolean showOnHome,
            Integer homePosition
    ) {
    }

    @PatchMapping("/{id}/home")
    public ApiResponse<Product> updateHomePlacement(
            @PathVariable Long id,
            @RequestBody HomeProductRequest request
    ) {

        try {

            Product product =
                    products.findById(id)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Product not found."
                                    )
                            );

            boolean showOnHome =
                    Boolean.TRUE.equals(
                            request.showOnHome()
                    );

            int homePosition =
                    request.homePosition() == null
                            ? 0
                            : Math.max(
                            0,
                            request.homePosition()
                    );

            /*
             * If product is hidden from homepage,
             * reset its position to 0.
             */
            if (!showOnHome) {
                homePosition = 0;
            }

            product.setShowOnHome(showOnHome);
            product.setHomePosition(homePosition);

            Product saved =
                    products.save(product);

            /*
             * Reload the product so the response
             * contains the latest database state.
             */
            Product result =
                    products.findById(id)
                            .orElseThrow(() ->
                                    new IllegalStateException(
                                            "Product could not be reloaded."
                                    )
                            );

            return ApiResponse.success(
                    "Homepage product placement updated successfully",
                    result
            );

        } catch (IllegalArgumentException e) {

            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {

            return ApiResponse.error(
                    "Unable to update homepage product: "
                            + safeMessage(e)
            );
        }
    }

    /*
     * =========================================================
     * PRODUCT IMAGE UPLOAD
     * =========================================================
     *
     * Frontend sends:
     *
     * POST /api/admin/products/{productId}/images
     *
     * multipart field:
     *
     * files
     *
     * Images go to Cloudinary.
     */

    @PostMapping(
            value = "/{productId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<List<ProductImage>> uploadImages(
            @PathVariable Long productId,
            @RequestParam("files") MultipartFile[] files
    ) {

        try {

            Product product =
                    products.findById(productId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Product not found."
                                    )
                            );

            if (files == null || files.length == 0) {

                return ApiResponse.error(
                        "Please select at least one image."
                );
            }

            List<ProductImage> existing =
                    productImageRepository
                            .findByProductIdOrderBySortOrderAsc(
                                    productId
                            );

            int nextSortOrder =
                    existing.stream()
                            .map(ProductImage::getSortOrder)
                            .filter(value -> value != null)
                            .max(Integer::compareTo)
                            .orElse(-1) + 1;

            boolean mainAlreadyExists =
                    existing.stream()
                            .anyMatch(
                                    image ->
                                            image.getType()
                                                    == ImageType.MAIN
                            );

            List<ProductImage> uploaded =
                    new ArrayList<>();

            for (MultipartFile file : files) {

                validateImage(file);

                String url =
                        cloudinaryStorage.uploadProductImage(
                                file.getBytes(),
                                productId,
                                nextSortOrder
                        );

                ProductImage image =
                        ProductImage.builder()
                                .product(product)
                                .url(url)
                                .type(
                                        !mainAlreadyExists
                                                && uploaded.isEmpty()
                                                ? ImageType.MAIN
                                                : ImageType.GALLERY
                                )
                                .sortOrder(nextSortOrder++)
                                .build();

                uploaded.add(
                        productImageRepository.save(
                                image
                        )
                );

                mainAlreadyExists = true;
            }

            return ApiResponse.success(
                    "Product images uploaded successfully",
                    uploaded
            );

        } catch (IllegalArgumentException e) {

            return ApiResponse.error(
                    e.getMessage()
            );

        } catch (Exception e) {

            return ApiResponse.error(
                    "Unable to upload product images: "
                            + safeMessage(e)
            );
        }
    }

    /*
     * =========================================================
     * VALIDATION
     * =========================================================
     */

    private void validateProductRequest(
            ProductRequest request
    ) {

        if (request.price()
                .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Price cannot be negative."
            );
        }

        if (request.discountPrice() != null
                && request.discountPrice()
                .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Discount price cannot be negative."
            );
        }

        if (request.discountPrice() != null
                && request.discountPrice()
                .compareTo(request.price()) > 0) {

            throw new IllegalArgumentException(
                    "Discount price cannot be greater than regular price."
            );
        }
    }

    private void validateImage(
            MultipartFile file
    ) {

        if (file == null || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "One of the selected images is empty."
            );
        }

        if (file.getSize()
                > 10L * 1024L * 1024L) {

            throw new IllegalArgumentException(
                    "Each product image must be 10MB or smaller."
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null
                || !contentType
                .toLowerCase()
                .startsWith("image/")) {

            throw new IllegalArgumentException(
                    "Only image files are allowed."
            );
        }
    }

        private Collection collectionFor(Long collectionId) {

                if (collectionId == null) {
                        return null;
                }

                return collections.findById(collectionId)
                                .orElseThrow(() ->
                                                new IllegalArgumentException(
                                                                "Selected collection was not found."
                                                )
                                );
        }

    private int nonNegative(
            Integer value,
            int defaultValue
    ) {

        if (value == null) {
            return defaultValue;
        }

        return Math.max(
                0,
                value
        );
    }

    private String blankToNull(
            String value
    ) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value.trim();
    }

    private String safeMessage(
            Exception e
    ) {

        String message =
                e.getMessage();

        if (message == null
                || message.isBlank()) {

            return "server error";
        }

        return message.length() > 250
                ? message.substring(0, 250)
                : message;
    }
}