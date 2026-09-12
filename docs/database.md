# Database Schema — Kashi Banaras

Engine: MySQL 8, InnoDB, utf8mb4. DDL lives at `backend/src/main/resources/db/schema.sql`
and is applied automatically by Flyway on backend startup (see `docs/architecture.md`).

## ER overview (textual)

```
users ──< addresses
users ──< carts ──< cart_items >── products
users ──< wishlists ──< wishlist_items >── products
users ──< orders ──< order_items >── products
orders ──< payments
users ──< reviews >── products ──< review_images
users ──< ai_color_previews >── products
categories ──< products ──< product_images
products ──< product_colors
products ──< inventory (1:1)
coupons ──< coupon_usage >── users
users (admin) ──< audit_logs
users ──< notifications
roles ──< users (many-to-many via user_roles)
```

## Seed accounts (dev only — see docs/admin-guide.md to rotate)

- Admin: `admin@kashibanaras.dev` / see `backend` `dev` profile seed (password hashed with BCrypt, never plaintext in git)
- Customer: `customer@kashibanaras.dev`
