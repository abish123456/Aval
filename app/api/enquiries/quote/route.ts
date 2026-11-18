// POST /api/enquiries/quote — Price a bag (subtotal, coupon, shipping, total) without saving anything.
// Cart and checkout show exactly what the server will charge when the order is placed.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { quoteEnquiry, EnquiryItemError } from "@/src/server/enquiry/service";
import { rateLimit, clientIp } from "@/src/server/api/rate-limit";

const schema = z.object({
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
    .max(30),
  couponCode: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`enquiry-quote:${clientIp(req)}`, 120, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid bag" }, { status: 400 });
    }
    if (parsed.data.items.length === 0) {
      return NextResponse.json({ subtotalPaise: 0, discountPaise: 0, shippingPaise: 0, totalPaise: 0, lines: [], couponCode: null, couponError: null, freeShippingRemainingPaise: 0, freeShippingThresholdPaise: 0 });
    }

    const quote = await quoteEnquiry(parsed.data.items, { couponCode: parsed.data.couponCode });
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof EnquiryItemError) {
      return NextResponse.json({ error: err.message, code: "ITEM_UNAVAILABLE" }, { status: 409 });
    }
    console.error("[POST /api/enquiries/quote]", err);
    return NextResponse.json({ error: "Could not price your bag. Please try again." }, { status: 500 });
  }
}
