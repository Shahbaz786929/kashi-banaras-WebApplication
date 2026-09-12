package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.AddToCartRequest;
import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.dto.CartResponse;
import com.kashibanaras.ecommerce.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

 private final CartService cartService;

 public CartController(CartService cartService) {
  this.cartService = cartService;
 }

 private Long getUserId(Authentication authentication) {

  Object credentials = authentication.getCredentials();

  if (credentials instanceof Number number) {
   return number.longValue();
  }

  throw new RuntimeException("User authentication information is missing");
 }

 @GetMapping
 public ResponseEntity<ApiResponse<CartResponse>> getCart(
         Authentication authentication
 ) {

  Long userId = getUserId(authentication);

  return ResponseEntity.ok(
          ApiResponse.success(
                  "Cart",
                  cartService.getCart(userId)
          )
  );
 }

 @PostMapping("/items")
 public ResponseEntity<ApiResponse<CartResponse>> addToCart(
         Authentication authentication,
         @Valid @RequestBody AddToCartRequest request
 ) {

  Long userId = getUserId(authentication);

  return ResponseEntity.ok(
          ApiResponse.success(
                  "Product added to cart",
                  cartService.addToCart(userId, request)
          )
  );
 }

 @PatchMapping("/items/{itemId}")
 public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(
         Authentication authentication,
         @PathVariable Long itemId,
         @RequestParam Integer quantity
 ) {

  Long userId = getUserId(authentication);

  return ResponseEntity.ok(
          ApiResponse.success(
                  "Cart updated",
                  cartService.updateQuantity(
                          userId,
                          itemId,
                          quantity
                  )
          )
  );
 }

 @DeleteMapping("/items/{itemId}")
 public ResponseEntity<ApiResponse<CartResponse>> removeFromCart(
         Authentication authentication,
         @PathVariable Long itemId
 ) {

  Long userId = getUserId(authentication);

  return ResponseEntity.ok(
          ApiResponse.success(
                  "Product removed from cart",
                  cartService.removeFromCart(
                          userId,
                          itemId
                  )
          )
  );
 }
}