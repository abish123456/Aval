-- Enquiry pricing breakdown (server-computed coupon + shipping) and stock release flag
ALTER TABLE "Enquiry" ADD COLUMN "subtotalPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Enquiry" ADD COLUMN "couponCode" VARCHAR(40);
ALTER TABLE "Enquiry" ADD COLUMN "discountPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Enquiry" ADD COLUMN "shippingPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Enquiry" ADD COLUMN "stockReleased" BOOLEAN NOT NULL DEFAULT false;

-- Existing rows: subtotal equals the old total (no discounts or shipping were applied)
UPDATE "Enquiry" SET "subtotalPaise" = "totalPaise";

CREATE INDEX "Enquiry_couponCode_idx" ON "Enquiry"("couponCode");
