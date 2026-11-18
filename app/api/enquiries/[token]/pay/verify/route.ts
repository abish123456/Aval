// POST /api/enquiries/[token]/pay/verify — Confirm a Razorpay checkout callback.
// Razorpay signs order_id|payment_id with the key secret; a valid signature proves
// the payment was captured for the order we created (whose amount we set).
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hasEnquiryAccess, safeEqual } from "@/src/server/enquiry/access";
import { confirmEnquiryPayment } from "@/src/server/enquiry/service";

const schema = z.object({
  razorpayOrderId: z.string().min(1).max(64),
  razorpayPaymentId: z.string().min(1).max(64),
  razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!hasEnquiryAccess(req, token)) {
      return NextResponse.json({ error: "Verification required" }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }
    const body = parsed.data;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment verification unavailable" }, { status: 503 });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { token },
      select: { razorpayOrderId: true },
    });
    if (!enquiry || enquiry.razorpayOrderId !== body.razorpayOrderId) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
      .digest("hex");
    if (!safeEqual(expected, body.razorpaySignature)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const result = await confirmEnquiryPayment({
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[POST pay/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
