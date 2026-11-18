// GET /api/enquiries/[token] — Full enquiry details (verified link holder or staff only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canViewEnquiry } from "@/src/server/enquiry/access";

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

    // Same response for "missing" and "not verified" would hide existence, but the
    // page needs to know whether to show the verify screen; the token itself is
    // unguessable, so a 401 here leaks nothing useful.
    if (!enquiry) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!(await canViewEnquiry(req, token))) {
      return NextResponse.json({ error: "Verification required" }, { status: 401 });
    }

    const { phoneLastFour: _omit, adminNotes: _notes, ...safe } = enquiry;
    void _omit;
    void _notes;

    return NextResponse.json(safe, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[GET /api/enquiries/[token]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
