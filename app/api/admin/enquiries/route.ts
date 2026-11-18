// GET /api/admin/enquiries — List all enquiries for admin
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { hasPermission } from "@/src/server/auth/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!hasPermission(session.role, "orders:read")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const STATUSES = ["ENQUIRY", "CONFIRMED", "MAKING", "DISPATCHED", "DELIVERED", "CANCELLED"];
    const rawStatus = searchParams.get("status")?.toUpperCase();
    const status = rawStatus && STATUSES.includes(rawStatus) ? rawStatus : null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

    // payment=unpaid → not paid and not cancelled (same rule as the "Pending payment" card)
    const unpaid = searchParams.get("payment") === "unpaid";
    const where = {
      ...(status ? { status: status as never } : {}),
      ...(unpaid ? { paymentStatus: { not: "PAID" as const }, status: { not: "CANCELLED" as const } } : {}),
    };

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rating: true,
          messages: { orderBy: { createdAt: "asc" } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.enquiry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { enquiries, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/admin/enquiries]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
