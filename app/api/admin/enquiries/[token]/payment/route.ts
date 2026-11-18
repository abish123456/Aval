// PATCH /api/admin/enquiries/[token]/payment — Record a payment received outside
// Razorpay (UPI to the shop's number, bank transfer, cash). Confirms the order.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { hasPermission } from "@/src/server/auth/rbac";

const schema = z.object({
  method: z.enum(["UPI", "BANK_TRANSFER", "CASH"]),
  reference: z.string().trim().max(80).optional(),
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
      return NextResponse.json({ error: "Choose how the payment was received" }, { status: 400 });
    }
    const { method, reference } = parsed.data;
    const { token } = await params;

    const enquiry = await prisma.enquiry.findUnique({
      where: { token },
      select: { id: true, status: true, paymentStatus: true, adminNotes: true, totalPaise: true },
    });
    if (!enquiry) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (enquiry.paymentStatus === "PAID") {
      return NextResponse.json({ error: "This order is already marked as paid" }, { status: 409 });
    }
    if (enquiry.status === "CANCELLED") {
      return NextResponse.json({ error: "This order is cancelled. Payment can't be recorded on it." }, { status: 409 });
    }

    const note = `Payment of ₹${(enquiry.totalPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: enquiry.totalPaise % 100 ? 2 : 0, maximumFractionDigits: 2 })} recorded manually (${method.replace("_", " ")}${reference ? `, ref ${reference}` : ""}) on ${new Date().toLocaleDateString("en-IN")}.`;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.enquiry.updateMany({
        where: { id: enquiry.id, paymentStatus: { not: "PAID" }, status: { not: "CANCELLED" } },
        data: {
          paymentStatus: "PAID",
          ...(enquiry.status === "ENQUIRY" ? { status: "CONFIRMED" as const } : {}),
          adminNotes: [enquiry.adminNotes, note].filter(Boolean).join("\n"),
        },
      });
      if (updated.count === 0) throw new Error("CHANGED");
      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "UPDATE",
          entityType: "Enquiry",
          entityId: enquiry.id,
          diff: { before: { paymentStatus: enquiry.paymentStatus }, after: { paymentStatus: "PAID", method, reference: reference ?? null } },
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "CHANGED") {
      return NextResponse.json({ error: "This order was just updated. Refresh and try again." }, { status: 409 });
    }
    console.error("[PATCH payment]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
