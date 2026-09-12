package com.kashibanaras.ecommerce.service;

import com.kashibanaras.ecommerce.dto.AddToCartRequest;
import com.kashibanaras.ecommerce.dto.CartItemResponse;
import com.kashibanaras.ecommerce.dto.CartResponse;
import com.kashibanaras.ecommerce.entity.Cart;
import com.kashibanaras.ecommerce.entity.CartItem;
import com.kashibanaras.ecommerce.entity.Product;
import com.kashibanaras.ecommerce.entity.ProductColor;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.repository.CartItemRepository;
import com.kashibanaras.ecommerce.repository.CartRepository;
import com.kashibanaras.ecommerce.repository.ProductRepository;
import com.kashibanaras.ecommerce.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    private Cart getOrCreateCart(Long userId) {

        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {

                    Cart cart = Cart.builder()
                            .user(getUser(userId))
                            .items(new ArrayList<>())
                            .build();

                    return cartRepository.save(cart);
                });
    }

    @Transactional
    public CartResponse getCart(Long userId) {

        Cart cart = getOrCreateCart(userId);

        List<CartItemResponse> items = cartItemRepository
                .findByCartId(cart.getId())
                .stream()
                .map(this::toItemResponse)
                .toList();

        return buildCartResponse(items);
    }

    @Transactional
    public CartResponse addToCart(
            Long userId,
            AddToCartRequest request
    ) {

        if (request.quantity() == null ||
                request.quantity() < 1) {

            throw new RuntimeException(
                    "Quantity must be at least 1"
            );
        }

        Product product = productRepository
                .findById(request.productId())
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        if (!product.isActive()) {
            throw new RuntimeException(
                    "Product is not available"
            );
        }

        Cart cart = getOrCreateCart(userId);

        CartItem item;

        if (request.productColorId() != null) {

            item = cartItemRepository
                    .findByCartIdAndProductIdAndProductColorId(
                            cart.getId(),
                            product.getId(),
                            request.productColorId()
                    )
                    .orElse(null);

        } else {

            item = cartItemRepository
                    .findByCartIdAndProductIdAndProductColorId(
                            cart.getId(),
                            product.getId(),
                            null
                    )
                    .orElse(null);
        }

        if (item != null) {

            item.setQuantity(
                    item.getQuantity() + request.quantity()
            );

            cartItemRepository.save(item);

        } else {

            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.quantity())
                    .build();

            if (request.productColorId() != null) {

                ProductColor color = new ProductColor();
                color.setId(request.productColorId());

                newItem.setProductColor(color);
            }

            cartItemRepository.save(newItem);
        }

        return getCart(userId);
    }

    @Transactional
    public CartResponse updateQuantity(
            Long userId,
            Long cartItemId,
            Integer quantity
    ) {

        if (quantity == null || quantity < 1) {

            throw new RuntimeException(
                    "Quantity must be at least 1"
            );
        }

        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository
                .findById(cartItemId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cart item not found"
                        ));

        if (!item.getCart()
                .getId()
                .equals(cart.getId())) {

            throw new RuntimeException(
                    "Cart item does not belong to this user"
            );
        }

        item.setQuantity(quantity);

        cartItemRepository.save(item);

        return getCart(userId);
    }

    @Transactional
    public CartResponse removeFromCart(
            Long userId,
            Long cartItemId
    ) {

        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository
                .findById(cartItemId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cart item not found"
                        ));

        if (!item.getCart()
                .getId()
                .equals(cart.getId())) {

            throw new RuntimeException(
                    "Cart item does not belong to this user"
            );
        }

        cartItemRepository.delete(item);

        return getCart(userId);
    }

    private CartItemResponse toItemResponse(
            CartItem item
    ) {

        Product product = item.getProduct();

        String imageUrl = null;

        if (product.getImages() != null &&
                !product.getImages().isEmpty()) {

            imageUrl = product.getImages()
                    .stream()
                    .sorted((a, b) ->
                            Integer.compare(
                                    a.getSortOrder() == null
                                            ? 0
                                            : a.getSortOrder(),

                                    b.getSortOrder() == null
                                            ? 0
                                            : b.getSortOrder()
                            )
                    )
                    .findFirst()
                    .map(image -> image.getUrl())
                    .orElse(null);
        }

        Long colorId = null;

        if (item.getProductColor() != null) {
            colorId = item.getProductColor().getId();
        }

        /*
         * Product price is BigDecimal,
         * but CartItemResponse expects Integer.
         *
         * Therefore convert the final price to Integer.
         */

        BigDecimal unitPriceDecimal =
                product.getDiscountPrice() != null
                        && product.getDiscountPrice()
                        .compareTo(BigDecimal.ZERO) > 0
                        && product.getDiscountPrice()
                        .compareTo(product.getPrice()) < 0
                        ? product.getDiscountPrice()
                        : product.getPrice();

        Integer unitPrice = unitPriceDecimal.intValue();

        Integer totalPrice =
                unitPrice * item.getQuantity();

        return new CartItemResponse(
                item.getId(),
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getSlug(),
                imageUrl,
                unitPrice,
                item.getQuantity(),
                colorId,
                totalPrice
        );
    }

    private CartResponse buildCartResponse(
            List<CartItemResponse> items
    ) {

        /*
         * CartItemResponse.totalPrice() is Integer,
         * so subtotal must also be calculated as Integer.
         */

        int subtotal = items.stream()
                .mapToInt(CartItemResponse::totalPrice)
                .sum();

        int totalQuantity = items.stream()
                .mapToInt(CartItemResponse::quantity)
                .sum();

        return new CartResponse(
                items,
                totalQuantity,
                subtotal,
                0,
                subtotal
        );
    }
}