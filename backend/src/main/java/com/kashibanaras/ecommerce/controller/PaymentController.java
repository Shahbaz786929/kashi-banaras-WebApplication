package com.kashibanaras.ecommerce.controller;

import com.kashibanaras.ecommerce.dto.ApiResponse;
import com.kashibanaras.ecommerce.entity.Order;
import com.kashibanaras.ecommerce.entity.Payment;
import com.kashibanaras.ecommerce.entity.enums.OrderStatus;
import com.kashibanaras.ecommerce.entity.enums.PaymentStatus;
import com.kashibanaras.ecommerce.repository.OrderRepository;
import com.kashibanaras.ecommerce.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

 private final OrderRepository orders;
 private final PaymentRepository payments;

 private final String key;
 private final String secret;
 private final String webhook;

 public PaymentController(
         OrderRepository orders,
         PaymentRepository payments,
         @Value("${app.razorpay.key-id:}") String key,
         @Value("${app.razorpay.key-secret:}") String secret,
         @Value("${app.razorpay.webhook-secret:}") String webhook
 ) {
  this.orders = orders;
  this.payments = payments;
  this.key = key;
  this.secret = secret;
  this.webhook = webhook;
 }

 // ---------------------------------------------------------
 // Create Razorpay Order
 // ---------------------------------------------------------

 @PostMapping("/create-order")
 public ApiResponse<?> create(@RequestParam Long orderId) throws Exception {

  if (key.isBlank() || secret.isBlank()) {
   return ApiResponse.error(
           "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
   );
  }

  // This is our application's Order entity
  Order order = orders.findById(orderId)
          .orElseThrow();

  RazorpayClient client = new RazorpayClient(key, secret);

  JSONObject request = new JSONObject();

  request.put(
          "amount",
          order.getTotalAmount()
                  .multiply(BigDecimal.valueOf(100))
                  .longValue()
  );

  request.put("currency", "INR");
  request.put("receipt", order.getOrderNumber());

  // This is Razorpay's Order object
  com.razorpay.Order razorpayOrder = client.orders.create(request);

  Payment payment = Payment.builder()
          .order(order)
          .razorpayOrderId(razorpayOrder.get("id"))
          .amount(order.getTotalAmount())
          .status(PaymentStatus.CREATED)
          .build();

  payments.save(payment);

  return ApiResponse.success(
          "Razorpay order created",
          Map.of(
                  "keyId", key,
                  "razorpayOrderId", razorpayOrder.get("id"),
                  "amount", request.getLong("amount"),
                  "currency", "INR"
          )
  );
 }

 // ---------------------------------------------------------
 // Verify Razorpay Payment
 // ---------------------------------------------------------

 @PostMapping("/verify")
 public ApiResponse<?> verify(
         @RequestBody Map<String, String> body
 ) throws Exception {

  try {

   Utils.verifyPaymentSignature(
           new JSONObject(body),
           secret
   );

   Payment payment = payments
           .findByRazorpayOrderId(
                   body.get("razorpay_order_id")
           )
           .orElseThrow();

   payment.setRazorpayPaymentId(
           body.get("razorpay_payment_id")
   );

   payment.setRazorpaySignature(
           body.get("razorpay_signature")
   );

   payment.setStatus(PaymentStatus.PAID);

   payments.save(payment);

   // Confirm our application order
   payment.getOrder().setStatus(
           OrderStatus.CONFIRMED
   );

   orders.save(payment.getOrder());

   return ApiResponse.success(
           "Payment verified",
           true
   );

  } catch (Exception e) {

   return ApiResponse.error(
           "Payment verification failed"
   );
  }
 }
}