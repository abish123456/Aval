// PATCH /api/admin/enquiries/[token]/tracking — Add tracking number
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { requirePermission } from "@/src/server/auth/rbac";
import { z } from "zod";

const schema = z.object({
  trackingNumber: z.string().min(1).max(64),
  adminNotes: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession();
    if (session) {
      requirePermission(session.role, "orders:update_status");
    } else if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const body = schema.parse(await req.json());

    const enquiry = await prisma.enquiry.update({
      where: { token },
      data: {
        trackingNumber: body.trackingNumber,
        adminNotes: body.adminNotes,
        status: "DISPATCHED",
      },
    });

    return NextResponse.json({ ok: true, trackingNumber: enquiry.trackingNumber });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[PATCH tracking]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
