# AVAL Store — Backend Design

Stack: Next.js (route handlers + server actions) · TypeScript · PostgreSQL · Prisma · Razorpay · S3-compatible storage · transactional email.
This package is the **server core**: schema, pricing engine, checkout/payment/stock/coupon logic, RBAC, tests. The Next.js UI calls into `src/server/*`; no business rule lives in a page or component.

## 1. Layering

```
UI (storefront / admin)  →  route handlers & server actions (thin: auth, zod-parse, call service, map errors)
                              ↓
                         src/server/*  services
   pricing/   pure engine, customisation validation     ← no I/O, fully unit-tested
   orders/    quote (loads rules) · checkout · stock · coupons · transitions
   payments/  razorpay (signatures, REST) · service (capture, webhook, expiry)
   auth/      rbac (permission matrix) · audit
                              ↓
                         Prisma → PostgreSQL (CHECK constraints + conditional UPDATEs are the last line of defence)
```
Rule: **the browser sends ids, quantities and customisation values. Never prices, discounts, totals-as-truth, roles or payment status.** `expectedTotal` is only a *consent check* ("this is what I saw"); the server recomputes and refuses (409 `PRICE_CHANGED` + fresh quote) if it differs.

## 2. Conventions
- Money = integer **paise**; percentages = integer **basis points**. No floats anywhere in pricing.
- Every order stores **snapshots** (names, SKUs, variant options, customisation rows, bundle components, each discount with its rule). Editing a product/promotion later never changes history.
- Soft-delete by status (`ARCHIVED`), never hard-delete catalogue rows that orders reference (`OrderItem.variantId` is nullable anyway).

## 3. Pricing pipeline (`pricing/engine.ts`, one function: `priceCart`)
1. Line = (base + variant adjustment + customisation charge) × qty. Bundle lines use the bundle price; saving vs sum of components is reported.
2. **Item offers** — PRODUCT (percent / fixed / sale price), QUANTITY_TIER (highest reached tier), BUY_X_GET_Y (cheapest units discounted). Default: **best single offer per line** (no accidental double discount). `stackItemOffers` turns on summing.
3. **Cart offer** — best single automatic cart promotion (min-spend, percent/fixed, optional cap); allocated to lines with largest-remainder rounding so line discounts sum *exactly*.
4. **Coupon** — one per order. Checks: status, dates, global & per-customer limits, customer-specific, first-order, min spend, item scope, combinability.
5. **Shipping** — flat, free above threshold or via FREE_SHIPPING promo, subject to `freeShippingWithOthers`.
6. **Tax** — `NONE | INCLUSIVE | EXCLUSIVE` + rate from settings. **No rate is assumed**; owner sets it after accountant review.
7. Invariants (tested): line total ≥ 0, discounts never exceed what remains, deterministic, tampered quantities throw.
Bundles are excluded from other offers unless the bundle is marked combinable. Messages returned: free-shipping remaining, next cart offer remaining ("Add ₹200 more…").

Stacking switches live in `Setting('stacking')`: `stackItemOffers, couponWithItemOffers, cartPromoWithCoupon, freeShippingWithOthers, thresholdsUseDiscountedSubtotal` (defaults in `types.ts`). Multiple coupons are off; the engine accepts one.

## 4. Order lifecycle
**Two independent state machines** (`orders/transitions.ts`):

| Payment | Set by |
|---|---|
| PENDING → PAID / FAILED | verified webhook (or verified callback) only |
| PAID → PARTIALLY_REFUNDED → REFUNDED | refund records processed via provider |

| Fulfilment | Next |
|---|---|
| CONFIRMED | PROCESSING, CANCELLED |
| PROCESSING | CUSTOMISATION_IN_PROGRESS, READY_TO_SHIP, CANCELLED |
| CUSTOMISATION_IN_PROGRESS | READY_TO_SHIP, CANCELLED |
| READY_TO_SHIP | SHIPPED, CANCELLED |
| SHIPPED | DELIVERED, RETURN_REQUESTED |
| DELIVERED | RETURN_REQUESTED |
| RETURN_REQUESTED | RETURNED, DELIVERED |

Every change writes `OrderStatusEvent` (who/when/why) + `AuditLog`. Online orders can't be shipped unless paid (`canShip`).

### Checkout sequence (`orders/checkout.ts`)
1. Idempotency: same `idempotencyKey` → return the existing order (also handles concurrent double-submit via unique-violation catch).
2. One DB transaction: re-quote from DB → compare `expectedTotal` → create order + items + discounts + snapshots → **reserve stock** → **claim coupon** → claim promotion/bundle limits → (COD: commit stock now).
3. *After* commit: create Razorpay order for `total` paise, store `Payment(providerOrderId)`. If the provider call fails → `cancelUnpaidOrder` releases stock + coupon.
4. Customer pays in Razorpay Checkout → webhook `payment.captured` → `applyPaymentCaptured` (row-locked, idempotent): verify amount → PAID → commit reservations to real stock movements → coupon COMMITTED → queue confirmation email.
5. Unpaid orders expire after 30 min (cron `expireUnpaidOrders`): stock + coupon released. Late payment on an expired order → order stays cancelled, **refund queued**, never shipped.

## 5. Concurrency controls
| Risk | Control |
|---|---|
| Overselling last unit | `UPDATE … WHERE stockOnHand - reserved >= qty` (0 rows ⇒ OutOfStock) + DB CHECK constraints + sorted lock order |
| Coupon over-redeem | conditional `UPDATE … WHERE redeemedCount < maxRedemptions` |
| Per-customer limit race | `pg_advisory_xact_lock(coupon:customer)` then count |
| Same coupon twice on one order | `UNIQUE(couponId, orderId)` |
| Duplicate order | `Order.idempotencyKey` UNIQUE |
| Duplicate payment processing | `FOR UPDATE` on Payment + PAID short-circuit + `providerPaymentId` UNIQUE |
| Duplicate webhook | `PaymentWebhookEvent UNIQUE(provider,eventId)` |
| Bundle stock cap | conditional `UPDATE Bundle … soldCount + qty <= stockLimit`; every component also reserves its own variant stock |

## 6. Payments
- Secrets only in env. Never store card data; only provider ids.
- Browser callback signature = HMAC(`order_id|payment_id`, key_secret). Webhook signature = HMAC(**raw** body, webhook_secret). Both timing-safe.
- Webhook returns 400 on bad signature, 200 on duplicates, 500 on handler failure (provider retries; handlers are idempotent).
- Refunds: owner-only permission → `Refund(PENDING)` → provider API with idempotency key → `refund.processed` webhook flips to PROCESSED; order becomes PARTIALLY_REFUNDED/REFUNDED. Refund amounts for discounted orders come from `OrderItem.lineTotal` (post-discount), so refunds never exceed what was paid.
- No production success is ever simulated; use Razorpay test keys in dev.

## 7. Auth & RBAC
- Customers: email+password (argon2id) via Auth.js credentials or similar; httpOnly, Secure, SameSite=Lax cookies; password reset via hashed single-use tokens.
- Admin: separate login route, role from DB on every request (never from the client), optional TOTP for OWNER.
- Permission matrix in `auth/rbac.ts`. Refunds, user management, settings, PII export: **OWNER only**. Customer routes always filter `WHERE userId = session.userId`.
- Rate limit: login, reset, coupon-check, order-track, custom-order submit (e.g. Upstash/Redis or Postgres counter).

## 8. API surface
Public / customer (zod-validated, rate-limited):
| Route | Purpose |
|---|---|
| GET `/api/products`, `/api/products/[slug]` | catalogue (filters/sort/pagination → SQL, tsvector or ILIKE+GIN on tags) |
| POST `/api/pricing/quote` | `buildQuote` for PDP/cart (no writes) |
| GET/POST/PATCH/DELETE `/api/cart` | cart items (guest cookie token or user) |
| POST `/api/coupons/check` | returns engine coupon result + exact discount |
| POST `/api/checkout/place` | `placeOrder` |
| POST `/api/payments/verify` | optional fast-path using checkout signature → `applyPaymentCaptured` |
| POST `/api/webhooks/razorpay` | `handleRazorpayWebhook(rawBody…)` |
| POST `/api/track-order` | reference + email/phone match, generic error on miss |
| POST `/api/custom-orders` · POST `/api/quotes/[token]/accept|reject` | custom requests, quote response |
| POST `/api/uploads/sign` | presigned PUT, type/size checked, private bucket |
| `/api/account/*` | profile, addresses, orders, wishlist, reviews — all ownership-filtered |
Admin (`/api/admin/*`, each handler begins with `requirePermission`; every write calls `audit()` in the same transaction):
products, categories, collections, inventory (adjust requires reason → `InventoryMovement`), orders (status via `canMoveFulfilment`), refunds, custom-orders & quotes (convert accepted quote → order), customers, promotions/coupons/combos, reviews, content, reports (+CSV), settings, users, audit-logs.
Jobs (Vercel Cron / system cron, `CRON_SECRET`): `expireUnpaidOrders` (5 min), email outbox sender with backoff (1 min), quote expiry (hourly), promotion status sync SCHEDULED→ACTIVE→EXPIRED (1 min; engine also checks dates itself, so a late cron can't leak an expired offer).

## 9. Reports — definitions (so numbers never disagree)
- **Gross sales** = Σ `Order.subtotal` of PAID/COD-confirmed, non-cancelled orders.
- **Discounts** = item + cart + coupon (+ shipping discount shown separately). **Refunds** = Σ processed `Refund.amount`.
- **Net revenue** = gross − discounts − refunds (excludes shipping & tax, shown as separate lines).
- **Promotion revenue** = Σ `lineTotal` of orders with a `PromotionRedemption`; this is *attributed*, not incremental — label it that way in the UI.
All from SQL aggregates on `Order`/`OrderDiscount`/`Refund` with date filters; nothing hard-coded.

## 10. Security checklist
zod on every input · parameterised queries only (Prisma/`$executeRaw` tagged templates — never string-built SQL) · output encoding by React · SameSite cookies + origin check on mutating routes · upload allow-list (jpg/png/webp, ≤5 MB, re-encode, random keys, private bucket + signed URLs) · no secrets or hashes in responses (select explicit fields) · generic errors on login/track · audit logs for admin writes · daily Postgres backups + monthly restore drill · PII retention/deletion job · consent flags for marketing/abandoned-cart.

## 11. Build order
1. `prisma migrate dev --name init`, append `prisma/sql/constraints.sql` to that migration, re-apply. 2. Seed settings, roles, first admin. 3. Catalogue/admin CRUD + uploads. 4. Wire `buildQuote` to PDP/cart. 5. `placeOrder` + Razorpay test mode + webhook (use a tunnel). 6. Orders/fulfilment/refunds/emails. 7. Custom quotes. 8. Reports, SEO, hardening, load-test checkout concurrency against a real DB.
