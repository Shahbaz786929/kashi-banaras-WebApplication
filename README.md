# Kashi Banaras — Premium Saree Commerce

A luxury Banarasi saree storefront and Spring Boot commerce foundation with customer pages, admin workspace, JWT auth APIs, cart/wishlist/order APIs, Razorpay integration scaffolding, Cloudinary configuration, and an AI Color Studio integration boundary.

## What is included

- Next.js 14 + TypeScript + Tailwind-ready premium storefront
- Responsive home, catalog, product detail, auth, cart, checkout, wishlist and order pages
- Admin dashboard, products, orders, customers and settings screens
- Spring Boot 3.3 + Java 21
- MySQL + Flyway schema
- JWT + BCrypt + role-based admin protection
- Product/category APIs
- Cart, wishlist, address and order APIs
- Razorpay create-order + signature verification endpoint
- Cloudinary configuration boundary
- AI Color Studio endpoint boundary with server-side key policy
- Swagger/OpenAPI configuration
- Docker Compose for MySQL/backend/frontend
- Development seed data

## Important production note

The UI is fully designed and the backend contains the commerce foundation, but third-party credentials are intentionally not included. Add real Razorpay, Cloudinary and AI provider credentials in environment variables before enabling live integrations.

The Color Studio UI includes a local visual preview for development. The backend `/api/ai/color-preview` endpoint is intentionally provider-agnostic and returns a queued response until a production AI image-edit provider is configured. Do not represent that queued response as a real AI-generated image in production.

## Run locally

1. Copy `.env.example` to `.env` and set a strong `JWT_SECRET` (32+ characters).
2. Start services:

```bash
docker compose up --build
```

3. Open `http://localhost:3000`.
4. Backend health: `http://localhost:8080/api/health`.
5. Swagger: `http://localhost:8080/swagger-ui.html`.

The dev profile seeds:

- `admin@kashibanaras.dev`
- `customer@kashibanaras.dev`

Passwords are controlled through `DEV_ADMIN_PASSWORD` / `DEV_CUSTOMER_PASSWORD`; defaults are for local development only and must be changed.

## Production checklist

- Use managed MySQL and private networking.
- Use a long random JWT secret from a secret manager.
- Configure real Razorpay test/live credentials and webhook verification.
- Configure Cloudinary signed uploads/server-side delivery policy.
- Configure a real AI image editing provider and persist completed previews in `ai_color_previews`.
- Replace demo image URLs with owned product photography.
- Configure email/SMS/WhatsApp provider.
- Configure DNS: root/www → frontend, `api.` → backend, `admin.` → admin app/route.
- Enable HTTPS, backups, monitoring and log retention.
- Run automated tests and security review before taking payments.
