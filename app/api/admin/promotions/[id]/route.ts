import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'
import { couponFields, checkCouponRules, toDate } from '@/src/server/coupons'

// The code itself can't change once created (customers may already have it).
const updateSchema = z.object(couponFields).partial()

// PATCH /api/admin/promotions/[id] — edit or switch a coupon on/off
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'promotions:write')

    const { id } = await ctx.params
    const body = updateSchema.parse(await req.json())

    const current = await prisma.coupon.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 })

    const problem = checkCouponRules({
      discountType: (body.discountType ?? current.discountType) as 'PERCENT' | 'FIXED',
      valueBp: body.valueBp ?? current.valueBp,
      startsAt: body.startsAt !== undefined ? body.startsAt : current.startsAt?.toISOString() ?? null,
      expiresAt: body.expiresAt !== undefined ? body.expiresAt : current.expiresAt?.toISOString() ?? null,
    })
    if (problem) return NextResponse.json({ success: false, error: problem }, { status: 422 })

    const updated = await prisma.coupon.update({
      where: { id },
      data: { ...body, startsAt: toDate(body.startsAt), expiresAt: toDate(body.expiresAt) },
    })
    await prisma.auditLog.create({
      data: { actorId: session.userId, action: 'UPDATE', entityType: 'Coupon', entityId: id, diff: { changed: Object.keys(body) } },
    })
    return ok(updated)
  } catch (error) {
    return apiError(error)
  }
}

// DELETE /api/admin/promotions/[id] — only coupons nobody has used yet.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'promotions:delete')

    const { id } = await ctx.params
    const coupon = await prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } })
    if (!coupon) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 })

    const enquiryUses = await prisma.enquiry.count({ where: { couponCode: coupon.code } })
    if (enquiryUses + coupon._count.redemptions > 0) {
      return NextResponse.json(
        { success: false, error: 'This coupon has been used on orders, so it is kept for your records. Switch it off instead.' },
        { status: 409 }
      )
    }

    await prisma.$transaction([
      prisma.coupon.delete({ where: { id } }),
      prisma.auditLog.create({ data: { actorId: session.userId, action: 'DELETE', entityType: 'Coupon', entityId: id } }),
    ])
    return ok({ deleted: true, id })
  } catch (error) {
    return apiError(error)
  }
}
