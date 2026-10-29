import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/quotes/[token] — View custom order quote
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params

    const customOrder = await prisma.customOrder.findUnique({
      where: { quoteToken: token },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        quotePricePaise: true,
        quoteNote: true,
        quoteSentAt: true,
        quoteExpiresAt: true,
        acceptedAt: true,
        declinedAt: true,
      },
    })

    if (!customOrder) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }

    return ok(customOrder)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/quotes/[token] — Accept or Decline quote
// ---------------------------------------------------------------------------

const actionSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
  reason: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params
    const { action } = actionSchema.parse(await req.json())

    const customOrder = await prisma.customOrder.findUnique({
      where: { quoteToken: token },
    })

    if (!customOrder) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }

    if (customOrder.quoteExpiresAt && customOrder.quoteExpiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'This quote has expired' }, { status: 410 })
    }

    if (action === 'ACCEPT') {
      const updated = await prisma.customOrder.update({
        where: { id: customOrder.id },
        data: {
          status: 'QUOTE_ACCEPTED',
          acceptedAt: new Date(),
        },
      })
      return ok({ message: 'Quote accepted successfully! Our team will contact you for payment & crafting.', customOrder: updated })
    } else {
      const updated = await prisma.customOrder.update({
        where: { id: customOrder.id },
        data: {
          status: 'QUOTE_DECLINED',
          declinedAt: new Date(),
        },
      })
      return ok({ message: 'Quote declined.', customOrder: updated })
    }
  } catch (error) {
    return apiError(error)
  }
}

