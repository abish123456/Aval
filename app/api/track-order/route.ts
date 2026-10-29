import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/track-order — Public, rate-limited
// ---------------------------------------------------------------------------

const trackSchema = z.object({
  query: z.string().min(1),
  email: z.string().email().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = trackSchema.parse(await req.json())
    const q = body.query.trim()

    // 1. First check if it matches an Enquiry token or customer phone
    const enquiry = await prisma.enquiry.findFirst({
      where: {
        OR: [
          { token: q },
          { customerPhone: { contains: q } },
          { customerWhatsapp: { contains: q } },
        ],
      },
    })

    if (enquiry) {
      return NextResponse.json({
        success: true,
        redirect: `/o/${enquiry.token}`,
        isEnquiry: true,
        data: {
          orderNumber: enquiry.token,
          fulfilmentStatus: enquiry.status,
          paymentStatus: enquiry.paymentStatus,
          createdAt: enquiry.createdAt,
          itemCount: Array.isArray(enquiry.items) ? (enquiry.items as unknown[]).length : 1,
          customerName: enquiry.customerName,
          carrier: 'Express Bridal Courier',
          trackingNumber: enquiry.trackingNumber ?? undefined,
        },
      })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: q },
          { guestPhone: { contains: q } },
          { guestEmail: q },
          ...(body.email ? [{ guestEmail: body.email }, { user: { email: body.email } }] : []),
        ],
      },
      include: {
        statusEvents: { orderBy: { createdAt: 'asc' } },
        items: true,
        payments: { select: { status: true, method: true } },
      },
    })

    // Generic error — don't reveal which field is wrong
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No order found with those details. Please check and try again.' },
        { status: 404 }
      )
    }

    return ok({
      orderNumber: order.orderNumber,
      fulfilmentStatus: order.fulfilmentStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      statusEvents: order.statusEvents,
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
      customerName: order.guestName ?? 'Valued Bride',
    })
  } catch (error) {
    return apiError(error)
  }
}

