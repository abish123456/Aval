// GET/POST /api/enquiries/[token]/messages — Customer side of the order chat.
// Staff reply through /api/admin/enquiries/[token]/messages.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { canViewEnquiry, hasEnquiryAccess } from "@/src/server/enquiry/access";
import { rateLimit } from "@/src/server/api/rate-limit";

const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const enquiry = await prisma.enquiry.findUnique({ where: { token }, select: { id: true } });
    if (!enquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!(await canViewEnquiry(req, token))) {
      return NextResponse.json({ error: "Verification required" }, { status: 401 });
    }

    const messages = await prisma.enquiryMessage.findMany({
      where: { enquiryId: enquiry.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("[GET messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!hasEnquiryAccess(req, token)) {
      return NextResponse.json({ error: "Verification required" }, { status: 401 });
    }

    const limit = rateLimit(`enquiry-msg:${token}`, 30, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "You are sending messages too quickly. Please wait a moment." }, { status: 429 });
    }

    const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Message must be 1–2000 characters" }, { status: 400 });
    }

    const enquiry = await prisma.enquiry.findUnique({ where: { token }, select: { id: true } });
    if (!enquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Sender is always the customer on this route — never taken from the request.
    const message = await prisma.enquiryMessage.create({
      data: {
        enquiryId: enquiry.id,
        senderType: "CUSTOMER",
        body: parsed.data.body,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("[POST messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
