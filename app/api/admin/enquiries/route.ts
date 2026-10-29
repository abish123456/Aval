// GET /api/admin/enquiries — List all enquiries for admin
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { requirePermission } from "@/src/server/auth/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      requirePermission(session.role, "orders:read");
    } else if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = 50;

    const where = status ? { status: status as never } : {};

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

    return NextResponse.json({ enquiries, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[GET /api/admin/enquiries]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
