// GET/POST /api/enquiries/[token]/messages — Web chat (no WhatsApp API needed)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const postSchema = z.object({
  senderType: z.enum(["CUSTOMER", "ADMIN"]),
  body: z.string().min(1).max(2000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const enquiry = await prisma.enquiry.findUnique({ where: { token } });
    if (!enquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    const body = postSchema.parse(await req.json());

    const enquiry = await prisma.enquiry.findUnique({ where: { token } });
    if (!enquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const message = await prisma.enquiryMessage.create({
      data: {
        enquiryId: enquiry.id,
        senderType: body.senderType,
        body: body.body,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[POST messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
