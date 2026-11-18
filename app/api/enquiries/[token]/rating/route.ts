// POST /api/enquiries/[token]/rating — Submit star rating after delivery
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hasEnquiryAccess } from "@/src/server/enquiry/access";

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
    if (!hasEnquiryAccess(req, token)) {
      return NextResponse.json({ error: "Verification required" }, { status: 401 });
    }
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose 1–5 stars; comments up to 500 characters" }, { status: 400 });
    }
    const body = parsed.data;

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

    // The order rating also becomes a verified review for each product in the
    // order. Reviews start hidden and appear in the store once approved in admin.
    const productIds = [
      ...new Set(
        ((Array.isArray(enquiry.items) ? enquiry.items : []) as { productId?: string }[])
          .map((i) => i.productId)
          .filter((id): id is string => !!id)
      ),
    ];
    const existing = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
    const firstName = enquiry.customerName.trim().split(/\s+/)[0] ?? "Customer";

    const rating = await prisma.$transaction(async (tx) => {
      const r = await tx.enquiryRating.create({
        data: { enquiryId: enquiry.id, stars: body.stars, comment: body.comment ?? null },
      });
      for (const p of existing) {
        await tx.review.create({
          data: {
            productId: p.id,
            guestName: firstName,
            rating: body.stars,
            body: body.comment?.trim() || "",
            verifiedPurchase: true,
            visible: false,
          },
        });
      }
      return r;
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (err) {
    console.error("[POST rating]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
