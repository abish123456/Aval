// GET /api/enquiries/[token] — Get full enquiry details (after client-side verify)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const enquiry = await prisma.enquiry.findUnique({
      where: { token },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        rating: true,
      },
    });

    if (!enquiry) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Never expose phoneLastFour in the response
    const safe = { ...enquiry };
    delete (safe as { phoneLastFour?: string }).phoneLastFour;

    return NextResponse.json(safe);
  } catch (err) {
    console.error("[GET /api/enquiries/[token]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
