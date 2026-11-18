// POST /api/admin/enquiries/[token]/messages — Staff reply in the order chat
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/src/server/auth/session";
import { hasPermission } from "@/src/server/auth/rbac";

const schema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function POST(
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
      return NextResponse.json({ error: "Message must be 1–2000 characters" }, { status: 400 });
    }

    const { token } = await params;
    const enquiry = await prisma.enquiry.findUnique({ where: { token }, select: { id: true } });
    if (!enquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const message = await prisma.enquiryMessage.create({
      data: { enquiryId: enquiry.id, senderType: "ADMIN", body: parsed.data.body },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("[POST admin messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
