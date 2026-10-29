// POST /api/enquiries/[token]/pay — Create Razorpay order or simulate in dev
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const enquiry = await prisma.enquiry.findUnique({ where: { token } });
    if (!enquiry) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (enquiry.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }
    if (enquiry.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This enquiry is cancelled" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isPlaceholder =
      !keyId ||
      !keySecret ||
      keyId.includes("placeholder") ||
      keySecret.includes("placeholder");

    if (isPlaceholder) {
      // In development or when test keys are placeholders:
      // Instantly mark enquiry as PAID & CONFIRMED!
      const updated = await prisma.enquiry.update({
        where: { token },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          razorpayPaymentId: "pay_simulated_" + Date.now(),
        },
      });

      return NextResponse.json({
        simulated: true,
        success: true,
        status: updated.status,
        message: "Payment simulated successfully! Order confirmed.",
      });
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
        notes: { enquiryToken: token, customerName: enquiry.customerName },
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      console.error("[Razorpay create order error]", err);
      return NextResponse.json(
        { error: "Payment gateway error. Check Razorpay credentials." },
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
