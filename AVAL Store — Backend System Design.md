# AVAL Store — Backend System Design

Prepared for AVAL Store · October 28, 2026

## 1. Goals and scope

This document describes the backend for the AVAL Store storefront, customer accounts, checkout, custom-order quotes and admin dashboard. The guiding rules are: the server is the only source of truth for prices, stock, roles and payment status; every money-moving or stock-moving action runs in a database transaction; and the promotion engine is a single service used by the product page, cart, checkout and order creation.

Non-goals for launch: multi-currency, loyalty points, WhatsApp automation and Tamil localisation. The schema leaves room for them, but they are built later as modules.

## 2. Architecture overview

**Style: modular monolith.** One Next.js (TypeScript) application contains the storefront, the admin UI and the API. A separate small worker process runs background jobs. One PostgreSQL database holds all data. This is simpler to run and test than microservices, and the module boundaries below make later extraction possible.

| Layer | Responsibility | Rule |
| --- | --- | --- |
| Presentation | Storefront and admin pages, server components | No business logic, no direct database access |
| API / server actions | Input validation (Zod), auth check, call a service | Thin; one handler per use case |
| Services | Business rules: pricing, promotions, checkout, inventory, quotes | Only layer that opens transactions |
| Repositories | Prisma queries | Return plain objects, never leak Prisma types to the UI |
| Integrations | Razorpay, email, object storage, courier | Behind interfaces so providers can be swapped or faked in tests |

**Runtime pieces**

- Web app: Next.js server (Node runtime, not edge, for Prisma and crypto).
- Worker: pg-boss queue consumer for emails, webhook retries, reservation expiry, promotion activation, report builds.
- PostgreSQL: primary store; also backs the job queue and rate-limit counters, so no Redis is needed at launch.
- Object storage: S3-compatible bucket (Cloudflare R2 or AWS S3) for images and private reference uploads.
- Email provider: Resend or Amazon SES.
- Payment provider: Razorpay (Orders API, Checkout, webhooks, Refunds API).

## 3. Module map

| Module | Owns | Used by |
| --- | --- | --- |
| catalog | products, variants, categories, collections, attributes, search | storefront, admin |
| customisation | field definitions, option values, charges, validation of submitted selections | catalog, pricing, cart |
| pricing | price calculation, price breakdown, snapshots | cart, checkout, orders |
| promotions | offers, bundles, quantity rules, cart rules, coupons, stacking rules, redemption records | pricing, admin |
| cart | guest and customer carts, revalidation | storefront, checkout |
| checkout | address and shipping capture, order creation, payment initiation | storefront |
| payments | Razorpay orders, signature checks, webhook processing, refunds | checkout, admin |
| orders | order and payment state machines, notes, audit history, invoices | admin, account |
| inventory | stock levels, reservations, movements, low-stock alerts | checkout, admin |
| custom-orders | requests, quotes, acceptance, conversion to order | storefront, admin |
| shipping-tax | rate rules, PIN rules, GST configuration, courier adapter | pricing, orders |
| identity | users, sessions, roles, permissions, admin provisioning | everything |
| content | banners, announcement bar, homepage sections, policies, FAQs, testimonials, SEO | storefront, admin |
| reviews | submission, eligibility, moderation | catalog, admin |
| notifications | templates, outbox, delivery log, retries | all modules |
| reporting | metric queries, exports | admin |
| audit | append-only action log | all admin actions |

## 4. Data model

All money is stored as integer paise (never floats) with a currency column defaulting to INR. All tables have id, created\_at and updated\_at. Soft-delete (archived\_at) is used for catalogue entities that orders reference.

**Identity**

- `users` (email unique, password\_hash, status, kind: customer or staff)
- `roles`, `permissions`, `role_permissions`, `user_roles`
- `customer_profiles` (user\_id, name, phone, marketing\_consent)
- `customer_addresses` (user\_id, label, address fields, PIN, is\_default)

**Catalogue**

- `products` (slug unique, title, description, status: draft, published, archived; flags: featured, best\_seller, is\_customisable; lead\_time\_days; seo fields)
- `product_variants` (product\_id, sku unique, option values as JSON, price\_paise, compare\_at\_paise, weight\_grams, barcode)
- `product_images` (product\_id, storage\_key, alt, position, is\_primary)
- `categories` (parent\_id for nesting, slug unique, position, banner\_image, status) and `product_categories`
- `collections` and `collection_products`
- `product_attributes` (colour, material, style, occasion) for filtering
- `customisation_fields` (product\_id, type: text, dropdown, radio, checkbox, image; required, max\_length, position) and `customisation_options` (field\_id, label, value, extra\_charge\_paise, available)

**Promotions**

- `promotions` (type: product, category, quantity, cart, bundle, flash\_sale, free\_shipping; status; priority; starts\_at, ends\_at; rule JSONB validated by Zod per type; stackable\_with JSONB; usage\_limit\_total, usage\_limit\_per\_customer; auto\_apply boolean)
- `promotion_targets` (promotion\_id, target\_type: product, variant, category, collection; target\_id)
- `bundles` and `bundle_components` (bundle\_id, product or variant or category selector, min\_qty, max\_qty, customer\_choice boolean)
- `coupons` (code unique case-insensitive, promotion\_id, customer\_id nullable, redemption\_count, status)
- `coupon_redemptions` and `promotion_redemptions` (order\_id, promotion\_id, customer\_id, discount\_paise, created\_at; unique on order\_id + promotion\_id)
- `promotion_settings` (stacking switches, one-coupon default, max combined discount)

**Commerce**

- `carts` (user\_id nullable, guest\_token, status, expires\_at) and `cart_items` (variant\_id or bundle\_id, quantity, customisation JSON, unit price is never stored here)
- `wishlist_items`
- `orders` (reference unique, user\_id nullable, guest email, address snapshot, subtotal, discount\_total, shipping, tax, grand\_total, payment\_status, fulfilment\_status, price\_snapshot JSONB, idempotency\_key unique)
- `order_items` (order\_id, product and variant snapshots, quantity, unit\_price, line\_discount, customisation snapshot JSONB, bundle\_instance\_id)
- `order_discounts` (order\_id, promotion\_id, rule snapshot JSONB, amount\_paise, allocated per line in JSONB)
- `order_events` (order\_id, type, from, to, actor, note) for history

**Payments and shipping**

- `payments` (order\_id, provider, provider\_order\_id unique, provider\_payment\_id unique nullable, status, amount, method, attempt\_no)
- `payment_webhook_events` (provider\_event\_id unique, payload, signature\_ok, processed\_at, error)
- `refunds` (payment\_id, amount, reason, provider\_refund\_id unique, status, restock boolean)
- `shipments` (order\_id, courier, tracking\_number, shipped\_at, delivered\_at) and `tracking_events`
- `shipping_rules` (kind: flat, order\_value, destination, weight; min, max, region or PIN list, rate, free\_above)
- `tax_settings` (GST on/off, rate per category, seller GSTIN, state of supply)

**Inventory**

- `inventory_items` (variant\_id unique, on\_hand, reserved, low\_stock\_threshold) with CHECK on\_hand >= 0, reserved >= 0 and reserved <= on\_hand
- `stock_reservations` (order\_id, variant\_id, quantity, expires\_at, status: held, committed, released)
- `inventory_movements` (variant\_id, delta, reason: sale, restock, adjustment, return, damage; reference; actor) append-only

**Custom orders, content and operations**

- `custom_requests` (reference unique, customer fields, description, budget range, event date, status) and `custom_request_files`
- `custom_quotes` (request\_id, version, line items JSON, total, production\_days, expires\_at, status: draft, sent, accepted, rejected, expired; converted\_order\_id)
- `reviews` (product\_id, user\_id, order\_item\_id for verified purchase, rating, body, status, owner\_reply)
- `content_blocks` (key, locale, JSON body, status, publish window), `banners`, `faqs`, `testimonials`, `policies`, `instagram_posts`
- `newsletter_subscribers` (email unique, consent\_at, unsubscribed\_at)
- `notification_outbox` (type, recipient, payload, status, attempts, next\_attempt\_at) and `notification_log`
- `idempotency_keys` (key unique, scope, response snapshot, expires\_at)
- `audit_logs` (actor\_id, action, entity, entity\_id, before JSONB, after JSONB, ip, created\_at)

**Indexes worth adding on day one:** products(status, slug), a GIN full-text index on product title, tags and attributes, product\_categories(category\_id, product\_id), orders(user\_id, created\_at), orders(payment\_status, fulfilment\_status, created\_at), promotions(status, starts\_at, ends\_at), coupons(lower(code)), inventory\_movements(variant\_id, created\_at), audit\_logs(entity, entity\_id).

## 5. Pricing and promotion engine

One pure function, `priceCart(input, now)`, returns a full breakdown. It reads configuration from the database but has no side effects, so it is cheap to call from the product page, cart, checkout and order creation, and easy to unit-test. Order creation calls it again inside the transaction and stores the result.

**Input:** cart lines (variant or bundle, quantity, customisation selections), customer id or null, coupon codes, shipping destination, current time.

**Pipeline, in fixed order**

1. **Resolve line base price.** Variant price plus each selected customisation charge, all read from the database. Selections are validated against the field definitions (required, allowed values, length limits, option availability).
2. **Product-level offers.** Collect active offers that target the product, variant, category or collection. Pick the single best offer per line unless two offers are explicitly flagged stackable. Respect maximum discount and maximum eligible quantity.
3. **Bundles.** Match lines to active bundles (fixed price, percentage, fixed amount, buy X get Y, mix-and-match). A line can belong to only one bundle instance. Bundle components are expanded into variant lines for stock and snapshots.
4. **Quantity offers.** Apply tiered thresholds on remaining eligible quantity, including free-gift lines.
5. **Cart-level automatic offers.** Spend-and-save, percentage above a threshold, category thresholds. Thresholds are evaluated on the amount after steps 2 to 4 only if the promotion says so.
6. **Coupons.** Validate code, status, window, minimum order, product and category restrictions, global and per-customer limits, then apply. Default is one coupon; multiple only if enabled in settings.
7. **Shipping.** Pick the matching shipping rule, then apply free-shipping promotions.
8. **Tax.** Apply GST from configuration (prices inclusive or exclusive as configured); no rate is assumed in code.
9. **Rounding and allocation.** Distribute every order-level discount across lines proportionally, in paise, with the remainder given to the largest line, so line totals always sum to the grand total.

**Stacking and conflict rules**

- Each promotion declares `stackable_with` (groups such as product, combo, cart, coupon, shipping). Two promotions combine only if both permit it, and the global switches in `promotion_settings` can further restrict.
- Hard guards: a line never goes below zero, total discount is capped by the configured maximum share of the subtotal, and a free item is never discounted twice.
- If several valid combinations exist, the engine picks the one with the lowest payable total for the customer, deterministically (ties broken by promotion priority, then id).

**Output:** per-line breakdown (base, adjustments, applied promotions, final), per-promotion discount totals, shipping, tax, grand total, a list of messages (for example, Add ₹200 more to unlock free shipping), and a price hash.

**Price hash and change detection.** The cart stores the hash the customer last saw. At checkout the server recomputes; if the hash differs, the API returns the new breakdown and a `PRICE_CHANGED` error, and the order is created only after the customer confirms.

**Redemption limits under concurrency.** Order creation increments counters with a conditional update, for example `UPDATE coupons SET redemption_count = redemption_count + 1 WHERE id = $1 AND (limit IS NULL OR redemption_count < limit)`, and checks the affected row count. Per-customer limits use a unique or counted row in `coupon_redemptions` inside the same transaction. If the transaction rolls back, the counters roll back with it.

**Scheduling.** Status is derived from `starts_at` and `ends_at` at read time (so expiry is exact), and a worker job flips stored status and clears caches. Countdown timers show only when `ends_at` is set.

## 6. Cart and checkout flow

1. **Cart.** Guests get an HttpOnly `cart_token` cookie; customers have a cart tied to their account. On login the guest cart is merged (quantities summed, customisations kept as separate lines). Each cart read calls `priceCart`.
2. **Checkout start.** `POST /api/checkout/start` validates address, shipping option and PIN serviceability, re-prices, and checks stock.
3. **Place order.** `POST /api/checkout/place` requires an `Idempotency-Key` header. In one transaction: re-price and compare the hash; lock and reserve stock for every variant line (bundle components included); create `orders` (payment\_status pending, fulfilment\_status confirmed on payment), `order_items`, `order_discounts` and redemption rows; store the full price snapshot.
4. **Create payment.** After the transaction commits, call Razorpay Orders API with the order amount and the order reference as receipt; save `provider_order_id`. If this call fails, the order stays pending and the reservation expires normally; the customer can retry on the same order.
5. **Pay.** The browser opens Razorpay Checkout. On return, the browser sends the payment id and signature to `POST /api/payments/verify`; the server verifies the HMAC and fetches the payment from Razorpay. This only speeds up the confirmation page. **The webhook is the authoritative event.**
6. **Confirm.** The webhook handler marks the payment captured, the order paid, commits reservations into stock movements, queues the confirmation email and owner alert.
7. **COD (if enabled).** Order is placed with payment\_status pending and fulfilment confirmed after phone or OTP verification rules the owner sets; stock is committed immediately.

Guest order access uses the order reference plus email or phone verification, rate-limited, with a signed short-lived token for the confirmation page.

## 7. Orders and payments: state machines

Payment and fulfilment states are independent columns, each changed only through a service function that checks the allowed transition and writes an `order_events` row.

**Payment status:** `pending → paid`, `pending → failed`, `failed → pending` (retry creates a new payment attempt), `paid → partially_refunded → refunded`, `paid → refunded`.

**Fulfilment status:** `confirmed → processing → customisation_in_progress → ready_to_ship → shipped → delivered`; `cancelled` from confirmed through ready\_to\_ship; `delivered → return_requested → returned`. Made-to-order items pass through customisation\_in\_progress; stock items skip it.

**Webhook handling (idempotent)**

1. Read the raw request body, verify the Razorpay signature with the webhook secret; reject with 400 if invalid.
2. Insert into `payment_webhook_events` with the provider event id; a unique violation means a duplicate, so return 200 without reprocessing.
3. In one transaction, lock the payment row, apply the transition only if it is valid from the current state (out-of-order events are ignored or parked), update order and reservations.
4. Mark the event processed; on error, record the message and let the job queue retry with backoff.

**Refunds.** Admin action (permission `refund.create`) calls the Razorpay Refunds API with an idempotency key, stores a `refunds` row, updates payment status when the provider confirms, optionally restocks, and reverses promotion redemption counts only if the owner chose to. Refund amounts are split across lines using the stored discount allocation so net revenue stays accurate.

**Cancellation and unpaid orders.** Unpaid orders with expired reservations are cancelled by a worker job (default 30 minutes), which releases stock and returns coupon redemptions.

## 8. Inventory and concurrency

- Available stock is `on_hand − reserved`. Reservation is a single guarded statement: `UPDATE inventory_items SET reserved = reserved + $q WHERE variant_id = $v AND on_hand - reserved >= $q`; zero rows updated means out of stock. Variants are processed in sorted id order to avoid deadlocks.
- Reservations expire (default 15 minutes while paying); commit converts a reservation into an `inventory_movements` sale row and reduces `on_hand`; release returns it.
- Bundles never have their own stock unless the owner sets a bundle cap; components are reserved individually, so every bundle sale reduces component stock correctly.
- Made-to-order products can use an optional capacity table (units per day or week) instead of stock.
- Every manual adjustment needs a reason and writes a movement; the worker raises low-stock alerts when `available <= low_stock_threshold`.
- Cancellation and return-with-restock create positive movements, never edits to history.

## 9. Custom orders and quotes

1. Customer submits the form; files go straight to private object storage using presigned upload URLs after type, size and count checks; the server records them on the request.
2. A reference such as `CR-YYMM-NNNNN` is generated; the outbox queues a customer confirmation and an owner notification.
3. Request states: `new → in_review → quoted → accepted | rejected | expired`, plus `closed`.
4. Admin builds a quote: line items, additional charges, production days, delivery estimate and expiry. Sending locks that version and emails a secure link and an account entry; edits create a new version.
5. The customer accepts or rejects from their account (or a signed link). Acceptance is idempotent and fails after expiry; a worker marks expired quotes.
6. On acceptance the quote converts into an order using the quote prices (a special pricing source, not the promotion engine), then follows the normal payment and fulfilment flow.

## 10. Authentication, roles and permissions

- **Auth library:** Auth.js with database sessions, so sessions can be revoked. Passwords hashed with argon2id. Email verification and password reset use single-use hashed tokens with short expiry.
- **Separate admin surface:** staff sign in at `/admin/login`, use a different cookie name and path, and have shorter session lifetimes. Two-factor authentication (TOTP) is required for the Owner role and offered to others.
- **First admin:** created by a one-time CLI command (`pnpm admin:create`) that reads email and a generated password prompt; there is no default account and no public sign-up for staff.
- **Authorisation:** every service function takes an actor and calls `can(actor, permission, resource)`. Pages and API routes never rely on hiding UI.

| Permission area | Owner | Product Manager | Order Manager | Customer Support |
| --- | --- | --- | --- | --- |
| Products, categories, inventory | Full | Full | View | View |
| Promotions and coupons | Full | Create and edit | View | View |
| Orders and shipping | Full | View | Full | View, add notes |
| Refunds | Full | No | Request | No |
| Customers and personal data | Full | No | Limited | Full, no export |
| Custom orders and quotes | Full | View | Full | Full |
| Content and reviews | Full | Content only | No | Reviews only |
| Reports and exports | Full | Product reports | Order reports | No |
| Users, roles, settings, audit logs | Full | No | No | No |

- **Customer isolation:** every account query is scoped by `user_id` in the repository; tests attempt cross-customer reads for every account endpoint.

## 11. API surface

Public and account actions use Next.js route handlers or server actions that share the same service layer. All inputs are validated with Zod; all responses use a consistent error shape (`code`, `message`, `fields`).

| Group | Examples |
| --- | --- |
| Catalogue | `GET /api/products` (filters, sort, pagination), `GET /api/products/:slug`, `GET /api/categories`, `GET /api/search/suggest` |
| Pricing | `POST /api/pricing/preview` (product page live breakdown), `GET /api/offers`, `GET /api/combos` |
| Cart | `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `DELETE /api/cart/items/:id`, `POST /api/cart/coupon`, `DELETE /api/cart/coupon/:code` |
| Checkout | `POST /api/checkout/start`, `POST /api/checkout/place`, `POST /api/payments/verify`, `POST /api/webhooks/razorpay` |
| Orders | `GET /api/account/orders`, `GET /api/account/orders/:ref`, `POST /api/track-order` |
| Account | profile, addresses, wishlist, reviews, custom requests, quotes (accept, reject) |
| Custom orders | `POST /api/custom-requests`, `POST /api/uploads/presign` |
| Admin | `/api/admin/*` mirrors the dashboard modules: products, variants, inventory, orders, refunds, promotions, coupons, bundles, custom orders, quotes, customers, content, reviews, reports, users, audit |

List endpoints use cursor pagination for the storefront and offset pagination with totals for admin tables. Mutating endpoints that can be retried (place order, refund, quote accept) require an idempotency key stored in `idempotency_keys`.

## 12. Background jobs and notifications

**Outbox pattern.** Services write a `notification_outbox` row in the same transaction as the business change. The worker sends it through the email provider, records the result in `notification_log`, and retries with exponential backoff (up to a limit, then flags for admin review). This guarantees no email is lost or sent for a rolled-back change.

| Job | Schedule | Purpose |
| --- | --- | --- |
| send-notification | on demand | Deliver outbox emails (order, payment, shipping, refund, quote, owner alerts) |
| process-webhook-retry | on demand | Retry failed webhook processing |
| expire-reservations | every minute | Release stock and cancel unpaid orders |
| activate-promotions | every minute | Sync stored status, bust caches |
| expire-quotes | hourly | Mark quotes expired, notify |
| low-stock-scan | hourly | Alert the owner |
| build-reports | nightly | Pre-aggregate daily sales tables |
| abandoned-cart | hourly (after launch) | Reminder emails, only for consenting customers |
| cleanup | daily | Expired tokens, guest carts, idempotency keys |

WhatsApp can be added later as another channel behind the same outbox, using an approved business messaging provider.

## 13. File and image handling

- Uploads use presigned PUT URLs with enforced content type and size; the server then verifies the object (magic-byte check, size, dimensions) before attaching it to a record. SVG and executable types are rejected.
- Public product and banner images are served through the CDN and Next.js image optimisation (AVIF or WebP, responsive sizes, lazy loading).
- Custom-order reference images live in a private bucket prefix and are shown to the owner and the submitting customer only through short-lived signed URLs.
- Original files are kept; derived sizes are generated on demand or by a worker with `sharp`.

## 14. Security

- Prices, discounts, stock, roles and payment status are never read from the request body; only identifiers, quantities, selections and codes are.
- Prisma parameterised queries only; no string-built SQL. React escaping plus a strict Content-Security-Policy; sanitised rich text for admin-edited content.
- CSRF: same-site cookies, origin checks on mutating routes, and tokens for server actions and forms.
- Rate limits (Postgres or in-memory with a shared store): login, password reset, coupon validation, order tracking, custom-request submission, newsletter sign-up.
- Secrets in environment variables only; Razorpay key secret and webhook secret never reach the browser; logs redact tokens, emails and addresses.
- Cards are handled entirely by Razorpay; AVAL stores no card data.
- Personal data: consent records for marketing, data export and deletion workflows, retention rules (for example, anonymise inactive guest orders after the legally required period, to be confirmed with the business’s accountant).
- All admin mutations write `audit_logs` with before and after values; the table is insert-only for the application database user.

## 15. Reporting and analytics

Reports read from SQL views and a nightly `daily_sales_summary` table, with live queries for today. Definitions are fixed and shown beside each number:

- **Gross sales:** sum of item prices before discounts. **Discounts:** sum of `order_discounts`. **Shipping** and **tax** are reported separately. **Refunds** come from `refunds`. **Net revenue** = gross − discounts − refunds (shipping and tax shown on their own lines).
- **Promotion report:** redemptions, orders, gross sales on orders that used it, discount granted, refunds, net revenue, average order value. These are attributed figures, not incremental lift, and the screen says so.
- Other reports: sales trend, product and category performance, order status mix, payment method split, inventory valuation and movement, custom-order conversion, repeat-customer rate.
- CSV exports stream from the database, are permission-checked, and are recorded in the audit log.

## 16. Caching and performance

- Next.js cache with tag-based revalidation: product, category, homepage content and active-offers caches are invalidated when the admin saves the matching record or when a promotion window opens or closes.
- The pricing engine loads active promotions once per request into memory (a small set) and evaluates in process; cart and checkout bypass the page cache.
- Search starts with PostgreSQL full-text search plus trigram matching for typo tolerance; move to a dedicated search service only if the catalogue outgrows it.
- Avoid N+1 queries with explicit `include` selections; paginate everything; keep storefront payloads small for slow mobile networks.

## 17. Observability, backups and recovery

- Structured JSON logs with a request id carried through services and jobs; error tracking (Sentry); uptime check on a health endpoint that tests the database and queue.
- Alerts for failed webhooks, growing outbox backlog, payment-status mismatches, and error-rate spikes.
- A daily reconciliation job compares Razorpay captured payments with local orders and flags differences.
- Database: managed PostgreSQL with automated daily backups and point-in-time recovery; backups are tested by restoring to a staging database each quarter. Object storage uses versioning on the private bucket.
- Documented runbooks: restore the database, rotate secrets, replay failed webhooks, manually fix a stuck payment.

## 18. Environments and deployment

| Environment | Purpose | Notes |
| --- | --- | --- |
| Local | Development | Docker Compose for PostgreSQL and a local S3 emulator; Razorpay test keys; seed script with sample catalogue |
| Staging | Full rehearsal | Own database and bucket; Razorpay test mode; same migrations as production |
| Production | Live | Live keys only here; seed data never loaded |

**Hosting.** The app needs a persistent Node server and a worker, plus managed PostgreSQL. Suitable options are a container platform (Render, Railway, Fly.io) or a VPS with Docker, or Vercel for the web app with a separate worker service and Neon or Supabase PostgreSQL. Ordinary shared PHP or cPanel hosting usually cannot run this stack and must be checked before committing.

**Pipeline.** Git push → CI (type check, lint, unit and integration tests against a throwaway PostgreSQL) → build → `prisma migrate deploy` → release. Migrations are backward compatible (expand, then contract) so a deploy can be rolled back.

**Configuration.** Environment variables are documented in `.env.example` with placeholder names only: database URL, auth secret, Razorpay key id, key secret and webhook secret, email provider key, storage credentials and bucket names, app base URL.

## 19. Testing strategy

- **Unit tests** (Vitest) for the pricing engine with a table of cases: percentage, fixed, category offers, combos, buy X get Y, quantity tiers, coupons, expiry, limits, stacking, free shipping, rounding, and refund allocation.
- **Integration tests** against a real PostgreSQL: concurrent order placement for the last unit of stock, concurrent redemption of a one-use coupon, duplicate webhook delivery, out-of-order webhook events, order cancellation and restock, bundle component stock.
- **Contract tests** for Razorpay using recorded fixtures and signature generation; no real payments in automated tests.
- **End-to-end tests** (Playwright) for browse, customise, add to cart, apply coupon, guest and account checkout, custom request and quote acceptance, and key admin flows.
- **Security tests:** unauthenticated admin access, role boundary checks, cross-customer reads, tampered prices and coupon codes, malicious uploads, unsigned webhooks.

## 20. Delivery plan and open decisions

**Build order** (each phase ends with a working app): 1) schema, auth, roles, admin provisioning; 2) catalogue, images, variants, customisation fields, inventory; 3) pricing and promotion engine with its test suite; 4) cart, checkout, Razorpay, webhooks, orders; 5) order management, shipping, invoices, notifications; 6) custom orders and quotes; 7) reports, SEO, hardening; 8) deployment and production smoke tests.

**Decisions needed from the owner**

- GST registration details, tax inclusive or exclusive pricing, and invoice format.
- Whether Cash on Delivery will be offered, and any COD limits or fees.
- Shipping method: flat rate, rules by region, or a courier aggregator (for example Shiprocket).
- Hosting budget and preferred provider.
- Review eligibility rule (verified purchasers only, or anyone).
- Return and exchange windows, and whether returns restock automatically.
- Reservation and unpaid-order timeouts.
- Whether the owner wants two-factor authentication enforced for all staff.

**Credentials still to set up:** Razorpay account (test and live), email provider and sending domain, object storage bucket, managed database, domain and SSL, error-tracking account.
