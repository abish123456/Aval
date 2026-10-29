import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { priceCart, loadPricingSettings } from '@/src/server/pricing/engine'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/pricing/quote
// Public — rate-limited in production via middleware
// ---------------------------------------------------------------------------

const quoteSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().int().min(1).max(50),
      size: z.string().optional(),
      customisation: z.string().optional(),
    })
  ).min(1),
  couponCode: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = quoteSchema.parse(await req.json())
    const settings = await loadPricingSettings()
    const quote = await priceCart(body.lines, body.couponCode, settings)
    return ok(quote)
  } catch (error) {
    return apiError(error)
  }
}

