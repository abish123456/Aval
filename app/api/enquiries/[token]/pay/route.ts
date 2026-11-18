// POST /api/enquiries/[token]/pay — Create a Razorpay order for this enquiry
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasEnquiryAccess } from "@/src/server/enquiry/access";

// Simulated payments are for local testing only. They need an explicit opt-in
// and are refused in production no matter what.
function simulationAllowed(): boolean {
  return process.env.PAYMENTS_SIMULATE === "true" && process.env.NODE_ENV !== "production";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!hasEnquiryAccess(req, token)) {
      return NextResponse.json({ error: "Verification required" }, { status: 401 });
    }

    const enquiry = await prisma.enquiry.findUnique({ where: { token } });
    if (!enquiry) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (enquiry.paymentStatus === "PAID") {
      return NextResponse.json({ error: "This order is already paid" }, { status: 400 });
    }
    if (enquiry.status === "CANCELLED") {
      return NextResponse.json({ error: "This order is cancelled" }, { status: 400 });
    }

    if (simulationAllowed()) {
      const updated = await prisma.enquiry.update({
        where: { token },
        data: {
          paymentStatus: "PAID",
          status: enquiry.status === "ENQUIRY" ? "CONFIRMED" : enquiry.status,
          razorpayPaymentId: "pay_simulated_" + Date.now(),
        },
      });
      return NextResponse.json({
        simulated: true,
        success: true,
        status: updated.status,
        message: "Test payment recorded (PAYMENTS_SIMULATE is on).",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.includes("placeholder") || keySecret.includes("placeholder")) {
      console.error("[POST pay] Razorpay keys are not configured");
      return NextResponse.json(
        { error: "Online payment is temporarily unavailable. Please message us in the chat." },
        { status: 503 }
      );
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: enquiry.totalPaise,
        currency: "INR",
        receipt: `aval_${token}`,
        notes: { enquiryToken: token },
      }),
    });

    if (!rzpRes.ok) {
      console.error("[Razorpay create order error]", await rzpRes.text());
      return NextResponse.json(
        { error: "Payment gateway error. Please try again in a few minutes." },
        { status: 502 }
      );
    }

    const rzpOrder = (await rzpRes.json()) as { id: string };

    await prisma.enquiry.update({
      where: { token },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amountPaise: enquiry.totalPaise,
      currency: "INR",
      keyId,
      customerName: enquiry.customerName,
      customerPhone: enquiry.customerPhone,
    });
  } catch (err) {
    console.error("[POST pay]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
