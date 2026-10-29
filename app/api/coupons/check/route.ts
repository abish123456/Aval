import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/coupons/check — Validate coupon and return discount info
// ---------------------------------------------------------------------------

const checkSchema = z.object({
  code: z.string().min(1),
  subtotalPaise: z.number().int().min(0),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { code, subtotalPaise } = checkSchema.parse(await req.json())

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    })

    if (!coupon || !coupon.active) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Invalid or expired coupon code' },
        { status: 404 }
      )
    }

    const now = new Date()
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Coupon is not yet active' },
        { status: 400 }
      )
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Coupon has expired' },
        { status: 400 }
      )
    }

    if (coupon.usageLimit !== null && coupon._count.redemptions >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Coupon usage limit reached' },
        { status: 400 }
      )
    }

    if (subtotalPaise < coupon.minSpendPaise) {
      const minSpendRs = Math.ceil(coupon.minSpendPaise / 100)
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: `Minimum order value of ₹${minSpendRs} required for this coupon`,
        },
        { status: 400 }
      )
    }

    let discountPaise = 0
    if (coupon.discountType === 'PERCENT') {
      discountPaise = Math.floor((subtotalPaise * coupon.valueBp) / 10000)
    } else if (coupon.discountType === 'FIXED') {
      discountPaise = Math.min(coupon.valueBp, subtotalPaise)
    }

    return ok({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountPaise,
      description: coupon.description,
    })
  } catch (error) {
    return apiError(error)
  }
}

