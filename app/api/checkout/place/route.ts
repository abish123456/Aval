import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { placeOrder } from '@/src/server/orders/checkout'
import { getSession } from '@/src/server/auth/session'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/checkout/place
// ---------------------------------------------------------------------------

const checkoutSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().int().min(1).max(50),
      size: z.string().optional(),
      customisation: z.string().optional(),
    })
  ).min(1),
  couponCode: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  addressId: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
  paymentMethod: z.enum(['RAZORPAY', 'COD']),
  expectedTotalPaise: z.number().int().positive(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = checkoutSchema.parse(await req.json())
    const session = await getSession()

    const result = await placeOrder({
      ...body,
      userId: session?.userId,
    }, session?.userId)

    return ok(result)
  } catch (error) {
    return apiError(error)
  }
}

