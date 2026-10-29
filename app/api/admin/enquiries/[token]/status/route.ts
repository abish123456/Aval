// PATCH /api/admin/enquiries/[token]/status — Update enquiry status
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { requirePermission } from "@/src/server/auth/rbac";
import { z } from "zod";

const VALID_STATUSES = ["CONFIRMED", "MAKING", "DISPATCHED", "DELIVERED", "CANCELLED"] as const;
const schema = z.object({
  status: z.enum(VALID_STATUSES),
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
      data: { status: body.status },
    });

    return NextResponse.json({ ok: true, status: enquiry.status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[PATCH status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
