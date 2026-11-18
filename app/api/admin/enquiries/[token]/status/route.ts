// PATCH /api/admin/enquiries/[token]/status — Update enquiry status
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { hasPermission } from "@/src/server/auth/rbac";
import { z } from "zod";
import { releaseStock } from "@/src/server/enquiry/service";

const VALID_STATUSES = ["CONFIRMED", "MAKING", "DISPATCHED", "DELIVERED", "CANCELLED"] as const;
const schema = z.object({
  status: z.enum(VALID_STATUSES),
});

// Allowed moves. ENQUIRY → CONFIRMED happens only when payment is recorded
// (Razorpay, or "Mark as paid" for UPI/cash). Production and delivery need a
// paid order. Cancelling returns reserved stock (once).
const TRANSITIONS: Record<string, readonly string[]> = {
  ENQUIRY: ["CANCELLED"],
  CONFIRMED: ["MAKING", "CANCELLED"],
  MAKING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
const NEEDS_PAYMENT = new Set(["MAKING", "DISPATCHED", "DELIVERED"]);
const LABEL: Record<string, string> = {
  ENQUIRY: "awaiting payment", CONFIRMED: "confirmed", MAKING: "handcrafting",
  DISPATCHED: "dispatched", DELIVERED: "delivered", CANCELLED: "cancelled",
};

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

    const { token } = await params;
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    }
    const next = parsed.data.status;

    const current = await prisma.enquiry.findUnique({
      where: { token },
      select: { id: true, status: true, paymentStatus: true, adminNotes: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!TRANSITIONS[current.status]?.includes(next)) {
      const hint = current.status === "ENQUIRY" && next !== "CANCELLED"
        ? " Record the payment first (Mark as paid) to confirm it."
        : "";
      return NextResponse.json(
        { error: `An order that is ${LABEL[current.status]} can't be moved to ${LABEL[next]}.${hint}` },
        { status: 422 }
      );
    }
    if (NEEDS_PAYMENT.has(next) && current.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "This order isn't paid yet. Record the payment before starting production or shipping." },
        { status: 422 }
      );
    }

    const enquiry = await prisma.$transaction(async (tx) => {
      // Conditional on the status we validated against, so two admins can't race
      const moved = await tx.enquiry.updateMany({
        where: { id: current.id, status: current.status },
        data: { status: next },
      });
      if (moved.count === 0) throw new Error("STATUS_CHANGED");
      if (next === "CANCELLED") {
        await releaseStock(tx, current.id, `Enquiry ${token} cancelled`);
        if (current.paymentStatus === "PAID") {
          await tx.enquiry.update({
            where: { id: current.id },
            data: { adminNotes: [current.adminNotes, "REFUND REQUIRED: order cancelled after payment."].filter(Boolean).join("\n") },
          });
        }
      }
      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "UPDATE",
          entityType: "Enquiry",
          entityId: current.id,
          diff: { before: { status: current.status }, after: { status: next } },
        },
      });
      return { status: next };
    });

    return NextResponse.json({ ok: true, status: enquiry.status });
  } catch (err) {
    if (err instanceof Error && err.message === "STATUS_CHANGED") {
      return NextResponse.json({ error: "This order was just updated by someone else. Refresh and try again." }, { status: 409 });
    }
    console.error("[PATCH status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
