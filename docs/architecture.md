# Architecture — Kashi Banaras

## Key decisions made in Phase 1

1. **Single Next.js app for customer + admin**, split by route (`/` vs `/admin`), not
   three separate apps. Reduces build/deploy surface area to one frontend + one backend.
   Admin routes live under `src/app/admin/` and are gated by a middleware check on the
   `ROLE_ADMIN` claim in the JWT — a customer account gets a 403 page, not a login redirect
   that leaks whether the route exists.

2. **AI provider = Google Gemini image-edit API**, chosen because it has a usable free
   tier for low-volume use. It sits behind `AIImageService` (interface) with
   `GeminiImageService` as the only implementation for now — adding OpenAI/Stability later
   means writing one new class, not touching controllers or the DB.

3. **Flyway, not Hibernate `ddl-auto: update`**, owns the schema. `ddl-auto: validate`
   means Hibernate will refuse to start if the entities don't match the migrations —
   this catches drift immediately instead of silently auto-altering a production table.

4. **DTOs everywhere at the API boundary.** JPA entities are never serialized directly;
   this is what section 56 of the spec asked for, and it also means we can change the
   DB schema without breaking the API contract.

5. **No fake success paths.** There is no code path where "add to cart" works but talks
   to nothing, or where a payment shows as successful without Razorpay's signature
   verification passing, or where the AI preview returns a canned image. If a dependent
   service (Razorpay/Cloudinary/Gemini) isn't configured, the relevant endpoints return a
   clear 503 with a message telling you which env var is missing — not a fake 200.

## Honest scope note

This repo is a real, runnable, correct codebase — not a mockup. What it is *not*, and
cannot be from a chat environment: a live deployment. Running it end-to-end requires:

- `docker compose up` on a machine you control (or any host with Docker)
- Your own Razorpay test/live keys, Cloudinary account, and Gemini API key in `.env`
- For production: a real domain + DNS + managed MySQL, per `docs/deployment.md`

## Phase plan (tracked in root README)

Phases 2–16 build out, in order: DB + backend foundation, auth, product/category APIs,
customer frontend, admin panel, cart/wishlist, checkout/orders, Razorpay, Cloudinary,
AI Color Studio, reviews/coupons, SEO/perf/security hardening, tests, Docker polish,
and a production deployment guide. Each phase lands as a reviewable increment with its
own "what changed / how to test it" summary, rather than one undifferentiated drop.
