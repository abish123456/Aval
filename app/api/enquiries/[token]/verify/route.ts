// POST /api/enquiries/[token]/verify — Verify last 4 digits of WhatsApp number
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { lastFour } = await req.json();

    if (!lastFour || !/^\d{4}$/.test(lastFour)) {
      return NextResponse.json(
        { error: "Enter exactly 4 digits" },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.findUnique({ where: { token } });

    if (!enquiry) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (enquiry.phoneLastFour !== lastFour) {
      return NextResponse.json(
        { error: "Incorrect number. Please try again." },
        { status: 401 }
      );
    }

    // Return a success flag — client stores in sessionStorage
    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("[POST /api/enquiries/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
