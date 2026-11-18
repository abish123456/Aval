// PATCH /api/admin/enquiries/[token]/tracking — Save the courier tracking number.
// From "handcrafting" it also marks the order dispatched; on a dispatched order
// it just corrects the number. Any other status is refused.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { hasPermission } from "@/src/server/auth/rbac";

const schema = z.object({
  trackingNumber: z.string().trim().min(4, "Enter the full tracking number").max(64),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!hasPermission(session.role, "orders:update_status")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid tracking number" }, { status: 400 });
    }

    const { token } = await params;
    const enquiry = await prisma.enquiry.findUnique({
      where: { token },
      select: { id: true, status: true, paymentStatus: true, trackingNumber: true },
    });
    if (!enquiry) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (enquiry.status !== "MAKING" && enquiry.status !== "DISPATCHED") {
      return NextResponse.json(
        { error: "Tracking can be added once the order is in handcrafting or already dispatched." },
        { status: 422 }
      );
    }
    if (enquiry.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "This order isn't paid yet, so it can't be shipped." }, { status: 422 });
    }

    await prisma.$transaction(async (tx) => {
      const moved = await tx.enquiry.updateMany({
        where: { id: enquiry.id, status: enquiry.status },
        data: { trackingNumber: parsed.data.trackingNumber, status: "DISPATCHED" },
      });
      if (moved.count === 0) throw new Error("CHANGED");
      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "UPDATE",
          entityType: "Enquiry",
          entityId: enquiry.id,
          diff: {
            before: { status: enquiry.status, trackingNumber: enquiry.trackingNumber },
            after: { status: "DISPATCHED", trackingNumber: parsed.data.trackingNumber },
          },
        },
      });
    });

    return NextResponse.json({ ok: true, trackingNumber: parsed.data.trackingNumber, status: "DISPATCHED" });
  } catch (err) {
    if (err instanceof Error && err.message === "CHANGED") {
      return NextResponse.json({ error: "This order was just updated. Refresh and try again." }, { status: 409 });
    }
    console.error("[PATCH tracking]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
