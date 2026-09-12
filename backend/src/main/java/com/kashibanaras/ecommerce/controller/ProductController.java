package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository repo;

    public ProductController(ProductRepository repo) {
        this.repo = repo;
    }

    /**
     * Get all ACTIVE products.
     *
     * These products are used by the public catalogue,
     * search and category pages.
     */
    @GetMapping
    public ApiResponse<List<Product>> all(
            @RequestParam(required = false) String collection
    ) {

        List<Product> products = collection == null || collection.isBlank()
                ? repo.findByActiveTrueOrderByIdDesc()
                : repo.findByCollectionSlugAndActiveTrueOrderByIdDesc(
                        collection.trim()
                );

        return ApiResponse.success(
                "Products",
                products
        );
    }

    /**
     * Get one ACTIVE product by slug.
     *
     * Inactive products must never be visible
     * through the public product URL.
     */
    @GetMapping("/{slug}")
    public ApiResponse<Product> bySlug(
            @PathVariable String slug
    ) {

        return repo.findBySlugAndActiveTrue(slug)
                .map(product ->
                        ApiResponse.success(
                                "Product",
                                product
                        )
                )
                .orElseGet(() ->
                        ApiResponse.error(
                                "Product not found"
                        )
                );
    }
}