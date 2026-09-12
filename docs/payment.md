# Payments

Razorpay integration is server-side. `POST /api/payment/create-order?orderId=...` creates a Razorpay order when credentials are configured. `POST /api/payment/verify` verifies the returned signature before marking the payment/order paid/confirmed.

Before production: configure webhook verification, idempotency, refund handling, reconciliation, and a production payment failure/retry flow.
