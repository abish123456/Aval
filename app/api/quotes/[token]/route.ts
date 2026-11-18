import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, apiError } from '@/src/server/api/helpers'
import { generateEnquiryToken, grantEnquiryAccess } from '@/src/server/enquiry/access'
import { rateLimit, clientIp } from '@/src/server/api/rate-limit'

// ---------------------------------------------------------------------------
// Custom-order quotes, opened from the link in the quote email/WhatsApp.
// GET  — show the quote
// POST — ACCEPT (with delivery details → becomes a payable order) or DECLINE
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params
    const co = await prisma.customOrder.findUnique({
      where: { quoteToken: token },
      select: {
        id: true,
        name: true,
        description: true,
        weddingDate: true,
        status: true,
        quotePricePaise: true,
        quoteNote: true,
        quoteSentAt: true,
        quoteExpiresAt: true,
        acceptedAt: true,
        declinedAt: true,
      },
    })
    if (!co) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })

    // Customer can continue to their order once accepted
    let orderToken: string | null = null
    if (co.status !== 'QUOTE_SENT' && co.status !== 'QUOTE_DECLINED') {
      const enquiry = await prisma.enquiry.findFirst({
        where: { adminNotes: { contains: `custom request ${co.id}` } },
        select: { token: true },
      })
      orderToken = enquiry?.token ?? null
    }

    const expired = co.status === 'QUOTE_SENT' && !!co.quoteExpiresAt && co.quoteExpiresAt < new Date()
    return ok({ ...co, id: undefined, expired, orderToken })
  } catch (error) {
    return apiError(error)
  }
}

const digits = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => /^(91)?[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number')

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('ACCEPT'),
    whatsapp: digits,
    address: z.object({
      street: z.string().trim().min(5, 'Enter your full street address').max(300),
      city: z.string().trim().min(2, 'Enter your city').max(80),
      state: z.string().trim().min(2, 'Enter your state').max(80),
      pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit pincode'),
    }),
  }),
  z.object({ action: z.literal('DECLINE'), reason: z.string().trim().max(500).optional() }),
])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const limit = rateLimit(`quote-action:${clientIp(req)}`, 10, 10 * 60 * 1000)
    if (!limit.ok) return NextResponse.json({ success: false, error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 })

    const { token } = await params
    const parsed = actionSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Please check your details' }, { status: 400 })
    }
    const body = parsed.data

    const co = await prisma.customOrder.findUnique({ where: { quoteToken: token } })
    if (!co) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    if (co.status !== 'QUOTE_SENT') {
      return NextResponse.json({ success: false, error: 'This quote has already been answered.' }, { status: 409 })
    }
    if (co.quoteExpiresAt && co.quoteExpiresAt < new Date()) {
      await prisma.customOrder.updateMany({ where: { id: co.id, status: 'QUOTE_SENT' }, data: { status: 'QUOTE_EXPIRED' } })
      return NextResponse.json({ success: false, error: 'This quote has expired. Message us for a fresh quote.' }, { status: 410 })
    }

    if (body.action === 'DECLINE') {
      const r = await prisma.customOrder.updateMany({
        where: { id: co.id, status: 'QUOTE_SENT' },
        data: {
          status: 'QUOTE_DECLINED',
          declinedAt: new Date(),
          ...(body.reason ? { quoteNote: `${co.quoteNote ?? ''}\n\nCustomer: ${body.reason}`.trim() } : {}),
        },
      })
      if (r.count === 0) return NextResponse.json({ success: false, error: 'This quote has already been answered.' }, { status: 409 })
      return ok({ message: 'Quote declined. Thank you for letting us know.' })
    }

    // ACCEPT → create a payable order (enquiry) for the quoted amount
    const whatsapp = body.whatsapp.slice(-10)
    const price = co.quotePricePaise ?? 0
    if (price <= 0) return NextResponse.json({ success: false, error: 'This quote has no price yet.' }, { status: 409 })

    let orderToken = generateEnquiryToken()
    for (let i = 0; i < 5 && (await prisma.enquiry.findUnique({ where: { token: orderToken }, select: { id: true } })); i++) {
      orderToken = generateEnquiryToken()
    }

    await prisma.$transaction(async (tx) => {
      const r = await tx.customOrder.updateMany({
        where: { id: co.id, status: 'QUOTE_SENT' },
        data: { status: 'QUOTE_ACCEPTED', acceptedAt: new Date() },
      })
      if (r.count === 0) throw new Error('ANSWERED')
      await tx.enquiry.create({
        data: {
          token: orderToken,
          phoneLastFour: whatsapp.slice(-4),
          customerName: co.name,
          customerPhone: co.phone.replace(/\D/g, '').slice(-10),
          customerWhatsapp: whatsapp,
          deliveryAddress: body.address,
          items: [
            {
              productId: '',
              productName: `Custom order: ${co.description.slice(0, 80)}${co.description.length > 80 ? '…' : ''}`,
              size: '',
              qty: 1,
              unitPaise: price,
              ...(co.weddingDate ? { weddingDate: co.weddingDate } : {}),
            },
          ],
          subtotalPaise: price,
          totalPaise: price,
          adminNotes: `From custom request ${co.id}. Quote accepted ${new Date().toLocaleDateString('en-IN')}.`,
        },
      })
    })

    return grantEnquiryAccess(NextResponse.json({ success: true, data: { redirect: `/o/${orderToken}` } }), orderToken)
  } catch (error) {
    if (error instanceof Error && error.message === 'ANSWERED') {
      return NextResponse.json({ success: false, error: 'This quote has already been answered.' }, { status: 409 })
    }
    return apiError(error)
  }
}
