// POST /api/webhooks/razorpay-enquiry — Payment confirmed → auto convert enquiry to order
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    if (secret) {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      if (expected !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body) as {
      event: string;
      payload: {
        payment: {
          entity: {
            id: string;
            order_id: string;
            notes?: { enquiryToken?: string };
          };
        };
      };
    };

    if (event.event !== "payment.captured") {
      return NextResponse.json({ ok: true });
    }

    const payment = event.payload.payment.entity;
    const enquiryToken = payment.notes?.enquiryToken;

    if (!enquiryToken) {
      return NextResponse.json({ ok: true }); // Not an enquiry payment
    }

    await prisma.enquiry.update({
      where: { token: enquiryToken },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId: payment.id,
        status: "CONFIRMED", // Enquiry → Order starts here
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Razorpay Enquiry Webhook]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
