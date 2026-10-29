// POST /api/enquiries — Create new enquiry from cart order form
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(10).max(15),
  customerWhatsapp: z.string().min(10).max(15),
  deliveryAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().length(6),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      size: z.string(),
      qty: z.number().int().min(1),
      unitPaise: z.number().int().min(1),
    })
  ).min(1),
});

function generateToken(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const totalPaise = data.items.reduce(
      (sum, item) => sum + item.unitPaise * item.qty,
      0
    );

    const whatsappDigits = data.customerWhatsapp.replace(/\D/g, "");
    const phoneLastFour = whatsappDigits.slice(-4);

    // Generate unique token
    let token = generateToken();
    let tries = 0;
    while (tries < 10) {
      const existing = await prisma.enquiry.findUnique({ where: { token } });
      if (!existing) break;
      token = generateToken();
      tries++;
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        token,
        phoneLastFour,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerWhatsapp: whatsappDigits,
        deliveryAddress: data.deliveryAddress,
        items: data.items,
        totalPaise,
      },
    });

    return NextResponse.json({ token: enquiry.token, totalPaise });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[POST /api/enquiries]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
