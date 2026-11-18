import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'
import { couponFields, checkCouponRules, toDate } from '@/src/server/coupons'

// ---------------------------------------------------------------------------
// Coupons (the only kind of offer checkout applies today).
// GET  /api/admin/promotions — list with real usage and discount given
// POST /api/admin/promotions — create a coupon
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'promotions:read')

    const [coupons, usage] = await Promise.all([
      prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.enquiry.groupBy({
        by: ['couponCode'],
        where: { couponCode: { not: null }, status: { not: 'CANCELLED' } },
        _count: { _all: true },
        _sum: { discountPaise: true },
      }),
    ])
    const byCode = new Map(usage.map((u) => [u.couponCode, u]))

    return ok(
      coupons.map((c) => ({
        ...c,
        used: byCode.get(c.code)?._count._all ?? 0,
        discountGivenPaise: byCode.get(c.code)?._sum.discountPaise ?? 0,
      }))
    )
  } catch (error) {
    return apiError(error)
  }
}

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,20}$/, 'Use 3–20 letters or numbers for the code'),
  ...couponFields,
  description: couponFields.description.default(''),
  minSpendPaise: couponFields.minSpendPaise.default(0),
  usageLimit: couponFields.usageLimit.default(null),
  perCustomerLimit: couponFields.perCustomerLimit.default(1),
  startsAt: couponFields.startsAt.default(null),
  expiresAt: couponFields.expiresAt.default(null),
  active: couponFields.active.default(true),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'promotions:write')

    const body = createSchema.parse(await req.json())
    const problem = checkCouponRules(body)
    if (problem) return NextResponse.json({ success: false, error: problem }, { status: 422 })

    const existing = await prisma.coupon.findUnique({ where: { code: body.code }, select: { id: true } })
    if (existing) {
      return NextResponse.json({ success: false, error: `A coupon with code ${body.code} already exists` }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...body,
        startsAt: toDate(body.startsAt),
        expiresAt: toDate(body.expiresAt),
      },
    })
    await prisma.auditLog.create({
      data: { actorId: session.userId, action: 'CREATE', entityType: 'Coupon', entityId: coupon.id },
    })

    return NextResponse.json({ success: true, data: coupon }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
