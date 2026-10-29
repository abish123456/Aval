import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/promotions — List promotions & coupons
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'promotions:read')

    const [promotions, coupons] = await Promise.all([
      prisma.promotion.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { redemptions: true },
          },
        },
      }),
    ])

    return ok({ promotions, coupons })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/promotions — Create promotion or coupon
// ---------------------------------------------------------------------------

const promoSchema = z.object({
  kind: z.enum(['PROMOTION', 'COUPON']),
  name: z.string().min(2),
  type: z.enum(['PRODUCT', 'COMBO', 'QUANTITY_TIER', 'BUY_X_GET_Y', 'CART', 'COUPON', 'FLASH']).default('COUPON'),
  discountType: z.enum(['PERCENT', 'FIXED', 'BUNDLE_PRICE']),
  valueBp: z.number().int().positive(),
  minSpendPaise: z.number().int().default(0),
  usageLimit: z.number().int().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  combinesWithCoupon: z.boolean().default(false),
  eligibleProductIds: z.array(z.string()).nullable().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'promotions:write')

    const body = promoSchema.parse(await req.json())

    if (body.kind === 'COUPON' || body.code) {
      if (!body.code) {
        return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 })
      }
      const existing = await prisma.coupon.findUnique({ where: { code: body.code.toUpperCase() } })
      if (existing) {
        return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 409 })
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: body.code.toUpperCase(),
          description: body.description ?? body.name,
          discountType: body.discountType,
          valueBp: body.valueBp,
          minSpendPaise: body.minSpendPaise,
          usageLimit: body.usageLimit,
          startsAt: body.startsAt ? new Date(body.startsAt) : null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          combinesWithCart: body.combinesWithCoupon,
          eligibleProductIds: body.eligibleProductIds ? (body.eligibleProductIds as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      })

      return NextResponse.json({ success: true, data: coupon }, { status: 201 })
    }

    const promotion = await prisma.promotion.create({
      data: {
        name: body.name,
        type: body.type,
        discountType: body.discountType,
        valueBp: body.valueBp,
        minSpendPaise: body.minSpendPaise,
        usageLimit: body.usageLimit,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        combinesWithCoupon: body.combinesWithCoupon,
        eligibleProductIds: body.eligibleProductIds ? (body.eligibleProductIds as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })

    return NextResponse.json({ success: true, data: promotion }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
