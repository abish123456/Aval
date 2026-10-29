// POST /api/enquiries/[token]/rating — Submit star rating after delivery
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = schema.parse(await req.json());

    const enquiry = await prisma.enquiry.findUnique({
      where: { token },
      include: { rating: true },
    });

    if (!enquiry) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (enquiry.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Rating available only after delivery" },
        { status: 400 }
      );
    }
    if (enquiry.rating) {
      return NextResponse.json(
        { error: "Already rated" },
        { status: 400 }
      );
    }

    const rating = await prisma.enquiryRating.create({
      data: {
        enquiryId: enquiry.id,
        stars: body.stars,
        comment: body.comment ?? null,
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[POST rating]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
