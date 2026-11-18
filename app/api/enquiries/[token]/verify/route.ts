// POST /api/enquiries/[token]/verify — Check last 4 digits of the WhatsApp number.
// On success sets an httpOnly access cookie that every other enquiry API requires.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { grantEnquiryAccess, safeEqual } from "@/src/server/enquiry/access";
import { rateLimit, clientIp } from "@/src/server/api/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // 5 attempts per order link and 20 per connection every 15 minutes
    const byToken = rateLimit(`enquiry-verify:token:${token}`, 5, WINDOW_MS);
    const byIp = rateLimit(`enquiry-verify:ip:${clientIp(req)}`, 20, WINDOW_MS);
    if (!byToken.ok || !byIp.ok) {
      const wait = Math.max(byToken.retryAfterSeconds, byIp.retryAfterSeconds);
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${Math.ceil(wait / 60)} minutes.` },
        { status: 429, headers: { "Retry-After": String(wait) } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { lastFour?: unknown };
    const lastFour = typeof body.lastFour === "string" ? body.lastFour : "";
    if (!/^\d{4}$/.test(lastFour)) {
      return NextResponse.json({ error: "Enter exactly 4 digits" }, { status: 400 });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { token },
      select: { token: true, phoneLastFour: true },
    });

    if (!enquiry || !safeEqual(enquiry.phoneLastFour, lastFour)) {
      return NextResponse.json(
        { error: "Incorrect number. Please try again." },
        { status: 401 }
      );
    }

    return grantEnquiryAccess(NextResponse.json({ verified: true }), enquiry.token);
  } catch (err) {
    console.error("[POST /api/enquiries/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
