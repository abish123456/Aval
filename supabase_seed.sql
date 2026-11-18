-- ============================================================================
-- AVAL STORE — SUPABASE SQL SEED SCRIPT
-- Usage: Copy-paste this entire script into Supabase SQL Editor and click "Run"
-- Admin Credentials Created:
--   Email:    diana@aval.com
--   Password: aval2026
--   Role:     OWNER
-- ============================================================================

-- STEP 1: CLEAN UP EXISTING DATA (OPTIONAL - REMOVE OLD TEST DATA)
TRUNCATE TABLE 
  "EnquiryMessage", 
  "EnquiryRating", 
  "Enquiry", 
  "Review", 
  "Wishlist", 
  "InventoryMovement", 
  "OrderItem", 
  "OrderDiscount", 
  "OrderStatusEvent", 
  "Payment", 
  "Refund", 
  "Order", 
  "CustomOrder", 
  "CouponRedemption", 
  "Coupon", 
  "Promotion", 
  "Product", 
  "Category", 
  "Address", 
  "Session", 
  "PasswordResetToken", 
  "AuditLog", 
  "EmailOutbox", 
  "User", 
  "Setting" 
CASCADE;

-- STEP 2: INSERT STORE SETTINGS
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES
  ('storeName', 'AVAL Store — Handcrafted Bridal Studio', NOW()),
  ('location', 'Kanyakumari, Tamil Nadu', NOW()),
  ('currency', 'INR', NOW()),
  ('freeShippingThresholdPaise', '50000', NOW()),
  ('flatShippingPaise', '8000', NOW()),
  ('taxMode', 'NONE', NOW()),
  ('taxRateBp', '0', NOW()),
  ('stackItemOffers', 'false', NOW()),
  ('supportPhone', '+91 94883 45678', NOW()),
  ('supportEmail', 'diana@aval.com', NOW())
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW();

-- STEP 3: INSERT ADMIN OWNER (diana@aval.com / aval2026)
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "phone", "createdAt", "updatedAt")
VALUES (
  'usr_admin_diana',
  'Diana / Studio Owner',
  'diana@aval.com',
  '$2b$12$YVrKclsR2NsrTPGRPeUupeVuL.MwunkyNdrcRkaP//YGAHkp06zyK',
  'OWNER',
  '+91 94883 45678',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET 
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = 'OWNER',
  "updatedAt" = NOW();

-- STEP 4: INSERT CATEGORIES
INSERT INTO "Category" ("id", "name", "slug", "image", "description", "sortOrder", "archived", "createdAt", "updatedAt") VALUES
  ('cat-1', 'Bridal Bangles', 'bridal-bangles', '/images/hero_bangles.jpg', 'Custom silk thread, Kundan, and pearl sets tailored to your wedding lehenga & saree.', 1, false, NOW(), NOW()),
  ('cat-2', 'Hair Clips & Pins', 'hair-clips', '/images/pearl_hair_clip.jpg', 'Jadabi floral hair extensions, poola jada clips, and bridal barrettes.', 2, false, NOW(), NOW()),
  ('cat-3', 'Customised Name Sets', 'customised', '/images/name_bangles.jpg', 'Embossed bride & groom names, wedding dates, and bridal hashtags.', 3, false, NOW(), NOW()),
  ('cat-4', 'Bridesmaid Favours', 'bridesmaid', '/images/kundan_set.jpg', 'Coordinated bangle sets, potli bags, and gift boxes for your bride tribe.', 4, false, NOW(), NOW()),
  ('cat-5', 'Gift Boxes & Combos', 'gift-sets', '/images/trousseau_box.jpg', 'Curated bridal trousseau sets complete with presentation velvet boxes.', 5, false, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET 
  "name" = EXCLUDED."name",
  "image" = EXCLUDED."image",
  "description" = EXCLUDED."description",
  "sortOrder" = EXCLUDED."sortOrder";

-- STEP 5: INSERT CORE STARTER PRODUCTS
INSERT INTO "Product" (
  "id", "name", "slug", "categoryId", "regularPricePaise", "salePricePaise", "stock", 
  "customisable", "isBestSeller", "isNew", "rating", "reviewCount", "description", 
  "details", "images", "sizes", "archived", "createdAt", "updatedAt"
) VALUES
  (
    'prod-1', 'Kundan Royal Bridal Bangle Set', 'kundan-bridal-bangle-set', 'cat-1',
    249900, 189900, 20, true, true, false, 4.9, 128,
    'Exquisite multi-row bridal set handcrafted in Kanyakumari with fine Kundan stones, rich crimson silk thread, and gold micro-plating. Designed to withstand wedding festivities with superior durability.',
    ARRAY['Handcrafted silk thread base with brass core', 'Hand-set Kundan stones and dangling mini pearls', 'Sizes: 2.4, 2.6, 2.8, 2.10', 'Customisation: Add bride & groom initials on central kada', 'Packaged in signature AVAL velvet gift trunk'],
    ARRAY['/images/hero_bangles.jpg', '/images/kundan_set.jpg', '/images/name_bangles.jpg'],
    ARRAY['2.4', '2.6', '2.8', '2.10'],
    false, NOW(), NOW()
  ),
  (
    'prod-2', 'Freshwater Pearl Bridal Hair Clip', 'pearl-hair-clip', 'cat-2',
    89900, 69900, 30, false, true, false, 4.8, 84,
    'Delicate hand-wired freshwater pearls intertwined with crystal marquis leaves on an alligator clip. Lightweight and comfortable for high-drama bridal hairstyles.',
    ARRAY['Genuine baroque freshwater pearls & Japanese seed beads', 'Non-slip grip teeth suitable for thick South Indian hair', 'Flexible wire branches to contour to updos or braids', 'Tarnish-resistant rose gold/antique gold plating'],
    ARRAY['/images/pearl_hair_clip.jpg', '/images/hero_bangles.jpg'],
    ARRAY['Standard (12cm)'],
    false, NOW(), NOW()
  ),
  (
    'prod-3', 'Bridal Temple Maang Tikka & Matha Patti', 'bridal-maang-tikka', 'cat-1',
    159900, 129900, 15, false, false, true, 4.9, 47,
    'Heritage temple jewellery style forehead ornament with Goddess Lakshmi engraving, ruby red cabochon stones, and hanging pearl jhumkis.',
    ARRAY['Antique gold finish with ruby red stones', 'Central pendant: 4.5cm width', 'Adjustable hooks for secure hair pin placement'],
    ARRAY['/images/antique_bangles.jpg', '/images/hero_bangles.jpg'],
    ARRAY['One Size'],
    false, NOW(), NOW()
  ),
  (
    'prod-4', 'Personalised Bride Name & Date Bangles', 'name-bangle-custom', 'cat-3',
    179900, 139900, 50, true, true, false, 5.0, 162,
    'Our most loved wedding keepsake! Pair of wide acrylic-brass kadas custom lettered with bride & groom names, wedding hashtag, and auspicious wedding date.',
    ARRAY['Calligraphy text printed & sealed under waterproof protective gloss', 'Choice of velvet border or golden zardosi trim', 'Delivery timeline: 5-7 working days across India'],
    ARRAY['/images/name_bangles.jpg', '/images/trousseau_box.jpg'],
    ARRAY['2.2', '2.4', '2.6', '2.8', '2.10'],
    false, NOW(), NOW()
  ),
  (
    'prod-5', 'Rose Gold Floral Bridal Hair Vine', 'rose-gold-hair-pin', 'cat-2',
    69900, 54900, 25, false, false, false, 4.7, 39,
    'Romantic 30cm flexible hair vine featuring enameled blush petals, Swarovski crystal droplets, and soft champagne gold wire.',
    ARRAY['Length: 30cm, bends easily around braids and chignons', 'Comes with 4 matching bobby pins and satin ribbons'],
    ARRAY['/images/pearl_hair_clip.jpg', '/images/trousseau_box.jpg'],
    ARRAY['30cm Vine'],
    false, NOW(), NOW()
  ),
  (
    'prod-6', 'Kanyakumari Temple Antique Bangle Pair', 'antique-bangle-set', 'cat-1',
    189900, 149900, 12, false, false, false, 4.9, 73,
    'Inspired by traditional South Indian temple motifs, this antique matte-gold kada pair features floral jaali engraving and deep red stones.',
    ARRAY['Screw-opening hinge closure for easy wear', 'Weight: 45g per piece', 'Lead and nickel free hypoallergenic alloy'],
    ARRAY['/images/antique_bangles.jpg', '/images/hero_bangles.jpg'],
    ARRAY['2.4', '2.6', '2.8'],
    false, NOW(), NOW()
  )
ON CONFLICT ("slug") DO UPDATE SET 
  "name" = EXCLUDED."name",
  "regularPricePaise" = EXCLUDED."regularPricePaise",
  "salePricePaise" = EXCLUDED."salePricePaise",
  "stock" = EXCLUDED."stock",
  "description" = EXCLUDED."description";

-- STEP 6: INSERT TEST PROMO COUPONS
INSERT INTO "Coupon" ("id", "code", "description", "discountType", "valueBp", "minSpendPaise", "usageLimit", "active", "createdAt", "updatedAt") VALUES
  ('c-wed10', 'WED10', 'Wedding Season Special — 10% off', 'PERCENT', 1000, 100000, 200, true, NOW(), NOW()),
  ('c-avalbride', 'AVALBRIDE', 'Bridal Welcome Gift — 15% off', 'PERCENT', 1500, 150000, 100, true, NOW(), NOW())
ON CONFLICT ("code") DO UPDATE SET "active" = true;

-- STEP 7: VERIFICATION QUERIES (RUN THESE TO CHECK)
SELECT id, name, email, role FROM "User";
SELECT name, slug, "salePricePaise" / 100 AS price_inr, stock FROM "Product";
