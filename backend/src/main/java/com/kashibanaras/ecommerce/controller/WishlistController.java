package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.entity.Wishlist;
import com.kashibanaras.ecommerce.entity.WishlistItem;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.repository.UserRepository;
import com.kashibanaras.ecommerce.repository.WishlistItemRepository;
import com.kashibanaras.ecommerce.repository.WishlistRepository;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final UserRepository users;
    private final WishlistRepository lists;
    private final WishlistItemRepository items;
    private final ProductRepository products;

    public WishlistController(
            UserRepository users,
            WishlistRepository lists,
            WishlistItemRepository items,
            ProductRepository products
    ) {
        this.users = users;
        this.lists = lists;
        this.items = items;
        this.products = products;
    }

    /**
     * Get logged-in user's ID from JWT authentication.
     */
    private Long getUserId(Authentication authentication) {

        if (authentication == null) {
            throw new RuntimeException("User authentication is missing");
        }

        Object credentials = authentication.getCredentials();

        if (credentials instanceof Number number) {
            return number.longValue();
        }

        throw new RuntimeException(
                "User authentication information is missing"
        );
    }

    /**
     * Get existing wishlist or create a new wishlist
     * for the logged-in user.
     */
    private Wishlist getOrCreateWishlist(Long userId) {

        User user = users.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return lists.findByUserId(userId)
                .orElseGet(() ->
                        lists.save(
                                Wishlist.builder()
                                        .user(user)
                                        .build()
                        )
                );
    }

    /**
     * GET /api/wishlist
     *
     * Returns all wishlist items belonging to
     * the currently logged-in user.
     */
    @GetMapping
    @Transactional
    public ApiResponse<List<Map<String, Object>>> getWishlist(
            Authentication authentication
    ) {

        Long userId = getUserId(authentication);

        Wishlist wishlist = getOrCreateWishlist(userId);

        List<Map<String, Object>> wishlistItems = new ArrayList<>();

        for (WishlistItem item :
                items.findByWishlistId(wishlist.getId())) {

            Product product = item.getProduct();

            Map<String, Object> wishlistItem = new HashMap<>();

            wishlistItem.put("id", item.getId());
            wishlistItem.put("productId", product.getId());
            wishlistItem.put("name", product.getName());

            wishlistItems.add(wishlistItem);
        }

        return ApiResponse.success(
                "Wishlist",
                wishlistItems
        );
    }

    /**
     * POST /api/wishlist/{productId}
     *
     * If product is not in wishlist:
     *     add product
     *
     * If product is already in wishlist:
     *     remove product
     */
    @PostMapping("/{productId}")
    @Transactional
    public ApiResponse<Boolean> toggleWishlist(
            Authentication authentication,
            @PathVariable Long productId
    ) {

        Long userId = getUserId(authentication);

        Wishlist wishlist = getOrCreateWishlist(userId);

        Product product = products.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found: " + productId
                        )
                );

        var existingItem =
                items.findByWishlistIdAndProductId(
                        wishlist.getId(),
                        productId
                );

        /*
         * Product already exists in wishlist.
         * Remove it.
         */
        if (existingItem.isPresent()) {

            items.delete(existingItem.get());

            return ApiResponse.success(
                    "Product removed from wishlist",
                    false
            );
        }

        /*
         * Product does not exist in wishlist.
         * Add it.
         */
        WishlistItem wishlistItem =
                WishlistItem.builder()
                        .wishlist(wishlist)
                        .product(product)
                        .build();

        items.save(wishlistItem);

        return ApiResponse.success(
                "Product added to wishlist",
                true
        );
    }
}