// POST /api/enquiries — Create new enquiry from the checkout form
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generateEnquiryToken, grantEnquiryAccess } from "@/src/server/enquiry/access";
import { quoteEnquiry, reserveStock, EnquiryItemError, CouponError, fieldErrorsFrom } from "@/src/server/enquiry/service";
import { rateLimit, clientIp } from "@/src/server/api/rate-limit";

const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => /^(91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number");

// Only ids, sizes, quantities and personalisation come from the browser.
// Prices and product names are always looked up on the server.
const schema = z.object({
  customerName: z.string().trim().min(2, "Enter your name").max(100),
  customerPhone: phone,
  customerWhatsapp: phone,
  deliveryAddress: z.object({
    street: z.string().trim().min(5, "Enter your full street address").max(300),
    city: z.string().trim().min(2, "Enter your city").max(80),
    state: z.string().trim().min(2, "Enter your state").max(80),
    pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        size: z.string().max(60).default(""),
        qty: z.number().int().min(1).max(20),
        customName: z.string().max(60).optional(),
        weddingDate: z.string().max(30).optional(),
      })
    )
    .min(1, "Your bag is empty")
    .max(30),
  couponCode: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`enquiry-create:${clientIp(req)}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many orders from this connection. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      const fieldErrors = fieldErrorsFrom(parsed.error.issues);
      return NextResponse.json(
        { error: Object.values(fieldErrors)[0] ?? "Please check your details.", fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const whatsappDigits = data.customerWhatsapp.slice(-10);
    const phoneLastFour = whatsappDigits.slice(-4);

    // Generate a unique token
    let token = generateEnquiryToken();
    for (let tries = 0; tries < 5; tries++) {
      const existing = await prisma.enquiry.findUnique({ where: { token }, select: { id: true } });
      if (!existing) break;
      token = generateEnquiryToken();
    }

    // Price, reserve stock and save in one transaction. A coupon code is
    // serialised with an advisory lock so usage limits hold under concurrency.
    const enquiry = await prisma.$transaction(async (tx) => {
      if (data.couponCode) {
        await tx.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtext(${"coupon:" + data.couponCode.toUpperCase()}))) AS l`;
      }
      const quote = await quoteEnquiry(data.items, {
        couponCode: data.couponCode,
        customerWhatsapp: whatsappDigits,
        strictCoupon: true,
        db: tx,
      });
      await reserveStock(tx, quote.lines, `Enquiry ${token}`);
      return tx.enquiry.create({
        data: {
          token,
          phoneLastFour,
          customerName: data.customerName,
          customerPhone: data.customerPhone.slice(-10),
          customerWhatsapp: whatsappDigits,
          deliveryAddress: data.deliveryAddress,
          items: quote.lines as unknown as object[],
          subtotalPaise: quote.subtotalPaise,
          couponCode: quote.couponCode,
          discountPaise: quote.discountPaise,
          shippingPaise: quote.shippingPaise,
          totalPaise: quote.totalPaise,
        },
      });
    }, { timeout: 15000 });
    const totalPaise = enquiry.totalPaise;

    // The customer who placed the order can open their link without re-verifying.
    return grantEnquiryAccess(
      NextResponse.json({ token: enquiry.token, totalPaise }),
      enquiry.token
    );
  } catch (err) {
    if (err instanceof CouponError) {
      return NextResponse.json({ error: err.message, code: "COUPON_INVALID" }, { status: 409 });
    }
    if (err instanceof EnquiryItemError) {
      return NextResponse.json({ error: err.message, code: "ITEM_UNAVAILABLE" }, { status: 409 });
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[POST /api/enquiries]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
