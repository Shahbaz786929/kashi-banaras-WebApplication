package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.Address;
import com.kashibanaras.ecommerce.entity.Cart;
import com.kashibanaras.ecommerce.entity.CartItem;
import com.kashibanaras.ecommerce.entity.Order;
import com.kashibanaras.ecommerce.entity.OrderItem;
import com.kashibanaras.ecommerce.entity.User;
import com.kashibanaras.ecommerce.entity.enums.OrderStatus;
import com.kashibanaras.ecommerce.repository.AddressRepository;
import com.kashibanaras.ecommerce.repository.CartItemRepository;
import com.kashibanaras.ecommerce.repository.CartRepository;
import com.kashibanaras.ecommerce.repository.OrderRepository;
import com.kashibanaras.ecommerce.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

 private final UserRepository users;
 private final OrderRepository orders;
 private final AddressRepository addresses;
 private final CartRepository carts;
 private final CartItemRepository cartItems;

 public OrderController(
         UserRepository users,
         OrderRepository orders,
         AddressRepository addresses,
         CartRepository carts,
         CartItemRepository cartItems
 ) {
  this.users = users;
  this.orders = orders;
  this.addresses = addresses;
  this.carts = carts;
  this.cartItems = cartItems;
 }

 public record CreateOrderRequest(
         Long shippingAddressId,
         Long billingAddressId,
         String paymentMethod
 ) {
 }

 @PostMapping
 @Transactional
 public ApiResponse<?> create(
         Authentication authentication,
         @RequestBody CreateOrderRequest request
 ) {

  Long userId =
          getUserId(authentication);

  if (request.shippingAddressId() == null) {
   return ApiResponse.error(
           "Shipping address is required."
   );
  }

  try {

   User user =
           users.findById(userId)
                   .orElseThrow(
                           () -> new RuntimeException(
                                   "User not found."
                           )
                   );

   Address shippingAddress =
           addresses.findById(
                           request.shippingAddressId()
                   )
                   .orElseThrow(
                           () -> new RuntimeException(
                                   "Shipping address not found."
                           )
                   );

   if (!shippingAddress
           .getUser()
           .getId()
           .equals(userId)) {

    return ApiResponse.error(
            "Invalid shipping address."
    );
   }

   Long billingId =
           request.billingAddressId() == null
                   ? request.shippingAddressId()
                   : request.billingAddressId();

   Address billingAddress =
           addresses.findById(
                           billingId
                   )
                   .orElseThrow(
                           () -> new RuntimeException(
                                   "Billing address not found."
                           )
                   );

   if (!billingAddress
           .getUser()
           .getId()
           .equals(userId)) {

    return ApiResponse.error(
            "Invalid billing address."
    );
   }

   Cart cart =
           carts.findByUserId(userId)
                   .orElseThrow(
                           () -> new RuntimeException(
                                   "Cart not found."
                           )
                   );

   List<CartItem> cartItemsList =
           cartItems.findByCartId(
                   cart.getId()
           );

   if (cartItemsList.isEmpty()) {
    return ApiResponse.error(
            "Cart is empty."
    );
   }

   /*
    * Calculate total directly from backend
    * cart data. Never trust frontend amount.
    */
   BigDecimal subtotal =
           cartItemsList
                   .stream()
                   .map(item -> {

                    BigDecimal price =
                            item.getProduct()
                                    .getDiscountPrice() != null
                                    ? item.getProduct()
                                    .getDiscountPrice()
                                    : item.getProduct()
                                    .getPrice();

                    return price.multiply(
                            BigDecimal.valueOf(
                                    item.getQuantity()
                            )
                    );
                   })
                   .reduce(
                           BigDecimal.ZERO,
                           BigDecimal::add
                   );

   String orderNumber =
           generateOrderNumber();

   Order order =
           Order.builder()
                   .orderNumber(
                           orderNumber
                   )
                   .user(user)
                   .shippingAddress(
                           shippingAddress
                   )
                   .billingAddress(
                           billingAddress
                   )
                   .subtotal(subtotal)
                   .discountAmount(
                           BigDecimal.ZERO
                   )
                   .shippingFee(
                           BigDecimal.ZERO
                   )
                   .taxAmount(
                           BigDecimal.ZERO
                   )
                   .totalAmount(
                           subtotal
                   )
                   .status(
                           OrderStatus.PENDING
                   )
                   .build();

   for (
           CartItem cartItem :
           cartItemsList
   ) {

    BigDecimal price =
            cartItem
                    .getProduct()
                    .getDiscountPrice() != null
                    ? cartItem
                    .getProduct()
                    .getDiscountPrice()
                    : cartItem
                    .getProduct()
                    .getPrice();

    OrderItem orderItem =
            OrderItem.builder()
                    .order(order)
                    .product(
                            cartItem
                                    .getProduct()
                    )
                    .productColor(
                            cartItem
                                    .getProductColor()
                    )
                    .productNameSnapshot(
                            cartItem
                                    .getProduct()
                                    .getName()
                    )
                    .unitPrice(price)
                    .quantity(
                            cartItem
                                    .getQuantity()
                    )
                    .build();

    order.getItems()
            .add(orderItem);
   }

   Order saved =
           orders.save(order);

   /*
    * Clear cart only AFTER order has
    * successfully been saved.
    */
   cartItemsList.forEach(
           cartItems::delete
   );

   return ApiResponse.success(
           "Order created successfully",
           Map.of(
                   "id",
                   saved.getId(),

                   "orderNumber",
                   saved.getOrderNumber(),

                   "amount",
                   saved.getTotalAmount(),

                   "status",
                   saved.getStatus().name()
           )
   );

  } catch (Exception e) {

   return ApiResponse.error(
           e.getMessage() != null
                   ? e.getMessage()
                   : "Unable to create order."
   );
  }
 }

 @GetMapping
 public ApiResponse<?> mine(
         Authentication authentication
 ) {

  Long userId =
          getUserId(authentication);

  return ApiResponse.success(
          "Orders",
          orders.findByUserId(
                          userId,
                          org.springframework.data.domain.PageRequest.of(
                                  0,
                                  50
                          )
                  )
                  .getContent()
  );
 }

 @GetMapping("/{id}")
 public ApiResponse<?> one(
         Authentication authentication,
         @PathVariable Long id
 ) {

  Long userId =
          getUserId(authentication);

  Order order =
          orders.findById(id)
                  .orElseThrow(
                          () -> new RuntimeException(
                                  "Order not found."
                          )
                  );

  if (!order
          .getUser()
          .getId()
          .equals(userId)) {

   return ApiResponse.error(
           "You are not allowed to view this order."
   );
  }

  return ApiResponse.success(
          "Order",
          order
  );
 }

 private Long getUserId(
         Authentication authentication
 ) {

  if (authentication == null) {
   throw new RuntimeException(
           "Authentication required."
   );
  }

  Object credentials =
          authentication.getCredentials();

  if (credentials instanceof Number number) {
   return number.longValue();
  }

  throw new RuntimeException(
          "User authentication information is missing."
  );
 }

 private String generateOrderNumber() {

  String base =
          "KB"
                  + LocalDateTime.now()
                  .toString()
                  .replaceAll(
                          "[^0-9]",
                          ""
                  );

  String candidate =
          base.substring(
                  0,
                  Math.min(
                          28,
                          base.length()
                  )
          );

  /*
   * Extremely unlikely collision protection.
   */
  if (orders
          .findByOrderNumber(candidate)
          .isPresent()) {

   candidate =
           candidate.substring(
                   0,
                   Math.min(
                           25,
                           candidate.length()
                   )
           )
                   + String.valueOf(
                   System.nanoTime()
           ).substring(0, 3);
  }

  return candidate;
 }
}