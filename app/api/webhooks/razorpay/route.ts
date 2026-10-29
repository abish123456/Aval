import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { applyPaymentCaptured, cancelUnpaidOrders } from '@/src/server/orders/checkout'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// POST /api/webhooks/razorpay
// Razorpay sends event payloads here — MUST return 200 quickly
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

  // Verify webhook signature
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSig, 'hex')

  const isValid =
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer)

  if (!isValid) {
    console.error('[Razorpay Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; payload?: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    switch (event.event) {
      case 'payment.captured': {
        const paymentEntity = (event.payload as Record<string, { entity: Record<string, string> }>)?.payment?.entity
        if (paymentEntity) {
          await applyPaymentCaptured(
            paymentEntity.order_id,
            paymentEntity.id,
            paymentEntity.method?.toUpperCase()
          )
        }
        break
      }

      case 'payment.failed': {
        const paymentEntity = (event.payload as Record<string, { entity: Record<string, string> }>)?.payment?.entity
        if (paymentEntity?.order_id) {
          const payment = await prisma.payment.findUnique({ where: { providerOrderId: paymentEntity.order_id } })
          if (payment) {
            await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
            await cancelUnpaidOrders()
          }
        }
        break
      }

      case 'refund.processed': {
        const refundEntity = (event.payload as Record<string, { entity: Record<string, string> }>)?.refund?.entity
        if (refundEntity?.id) {
          await prisma.refund.updateMany({
            where: { providerRefundId: refundEntity.id },
            data: { status: 'PROCESSED' },
          })
        }
        break
      }

      default:
        // Unknown event — log and return 200 (don't retry)
        console.log(`[Razorpay Webhook] Unhandled event: ${event.event}`)
    }
  } catch (error) {
    console.error('[Razorpay Webhook] Handler error:', error)
    // Return 500 so Razorpay retries
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

