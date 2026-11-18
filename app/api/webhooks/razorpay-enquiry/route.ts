// POST /api/webhooks/razorpay-enquiry — Razorpay payment.captured → confirm the enquiry
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { safeEqual } from "@/src/server/enquiry/access";
import { confirmEnquiryPayment } from "@/src/server/enquiry/service";

interface PaymentEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without a secret we cannot tell real events from forged ones.
    console.error("[Razorpay Enquiry Webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (!safeEqual(expected, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PaymentEvent;
  try {
    event = JSON.parse(body) as PaymentEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "payment.captured") {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id || typeof payment.amount !== "number") {
    return NextResponse.json({ ok: true });
  }
  if (payment.currency && payment.currency !== "INR") {
    console.error(`[Razorpay Enquiry Webhook] Unexpected currency ${payment.currency} for ${payment.order_id}`);
    return NextResponse.json({ ok: true });
  }

  try {
    // Look up by the Razorpay order id we stored — never by notes, which the
    // order creator controls — and check the captured amount.
    const result = await confirmEnquiryPayment({
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      amountPaise: payment.amount,
    });
    if (result === "AMOUNT_MISMATCH" || result === "PAID_AFTER_CANCEL") {
      console.error(`[Razorpay Enquiry Webhook] ${result} for order ${payment.order_id}, payment ${payment.id}`);
    }
    // NOT_FOUND is acknowledged: the payment may belong to the other order pipeline.
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[Razorpay Enquiry Webhook]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 }); // Razorpay retries
  }
}
