import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { applyPaymentCaptured } from '@/src/server/orders/checkout'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/payments/verify
// Fast-path: client sends Razorpay callback signature for immediate confirmation
// ---------------------------------------------------------------------------

const verifySchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = verifySchema.parse(await req.json())
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? ''

    // Verify HMAC signature (timing-safe)
    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
      .digest('hex')

    const sigBuffer = Buffer.from(body.razorpaySignature, 'hex')
    const expectedBuffer = Buffer.from(expectedSig, 'hex')

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    await applyPaymentCaptured(body.razorpayOrderId, body.razorpayPaymentId, 'RAZORPAY')

    // Get order number for redirect
    const payment = await prisma.payment.findUnique({
      where: { providerOrderId: body.razorpayOrderId },
      include: { order: { select: { orderNumber: true } } },
    })

    return ok({ orderNumber: payment?.order.orderNumber })
  } catch (error) {
    return apiError(error)
  }
}

