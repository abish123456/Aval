import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, apiError } from '@/src/server/api/helpers'
import { grantEnquiryAccess, last10 } from '@/src/server/enquiry/access'
import { rateLimit, clientIp } from '@/src/server/api/rate-limit'

// ---------------------------------------------------------------------------
// POST /api/track-order — Public, rate-limited.
// Needs two matching facts: the order reference (exact) AND the phone number
// (or email) used on the order. Partial matches never return anything.
// ---------------------------------------------------------------------------

const trackSchema = z.object({
  query: z.string().trim().min(4).max(40),
  contact: z.string().trim().min(5).max(120),
})

const notFound = () =>
  NextResponse.json(
    { success: false, error: 'No order found with those details. Please check and try again.' },
    { status: 404 }
  )

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const limit = rateLimit(`track-order:${clientIp(req)}`, 10, 10 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many searches. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const parsed = trackSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Enter your order reference and the phone number used on the order.' },
        { status: 400 }
      )
    }

    const reference = parsed.data.query
    const contact = parsed.data.contact
    const isEmail = contact.includes('@')
    const phone = last10(contact)
    if (!isEmail && phone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Enter the full 10-digit phone number used on the order.' },
        { status: 400 }
      )
    }

    // 1. Private-link orders (enquiries): reference is the link code; must match phone.
    //    Accept a pasted full link too (…/o/<token>).
    const token = reference.split('/').filter(Boolean).pop() ?? reference
    const enquiry = await prisma.enquiry.findUnique({
      where: { token },
      select: { token: true, customerPhone: true, customerWhatsapp: true },
    })
    if (enquiry) {
      const matches =
        !isEmail && (last10(enquiry.customerWhatsapp) === phone || last10(enquiry.customerPhone) === phone)
      if (!matches) return notFound()
      // Phone proven — let them straight into their order page.
      return grantEnquiryAccess(
        NextResponse.json({ success: true, redirect: `/o/${enquiry.token}`, isEnquiry: true }),
        enquiry.token
      )
    }

    // 2. Standard orders: exact order number AND matching phone or email.
    const order = await prisma.order.findUnique({
      where: { orderNumber: reference.toUpperCase() },
      include: {
        statusEvents: { orderBy: { createdAt: 'asc' } },
        items: true,
        user: { select: { email: true, phone: true } },
      },
    })
    if (!order) return notFound()

    const contactMatches = isEmail
      ? [order.guestEmail, order.user?.email].some((e) => e && e.toLowerCase() === contact.toLowerCase())
      : [order.guestPhone, order.user?.phone].some((p) => p && last10(p) === phone)
    if (!contactMatches) return notFound()

    return ok({
      orderNumber: order.orderNumber,
      fulfilmentStatus: order.fulfilmentStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      statusEvents: order.statusEvents.map((e) => ({ toStatus: e.toStatus, createdAt: e.createdAt })),
      itemCount: order.items.length,
      items: order.items.map((it) => {
        const snap = it.snapshotJson as { name?: string; image?: string }
        return {
          id: it.id,
          name: snap?.name ?? 'Bridal Item',
          image: snap?.image ?? '/images/hero_bangles.jpg',
          size: it.size ?? 'Standard',
          qty: it.qty,
          customName: it.customisation,
          price: it.lineTotalPaise / 100,
        }
      }),
      total: order.totalPaise / 100,
      customerName: order.guestName ?? undefined,
    })
  } catch (error) {
    return apiError(error)
  }
}
