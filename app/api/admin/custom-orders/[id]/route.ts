import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// PATCH /api/admin/custom-orders/[id] — close or progress a custom request.
// (Quotes are sent via ./quote; acceptance comes from the customer.)
const TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ['CANCELLED'],
  QUOTE_SENT: ['CANCELLED'],
  QUOTE_DECLINED: ['CANCELLED'],
  QUOTE_EXPIRED: ['CANCELLED'],
  QUOTE_ACCEPTED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

const schema = z.object({
  status: z.enum(['IN_PRODUCTION', 'COMPLETED', 'CANCELLED']),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'custom_orders:write')

    const { id } = await ctx.params
    const { status } = schema.parse(await req.json())

    const current = await prisma.customOrder.findUnique({ where: { id }, select: { status: true } })
    if (!current) return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    if (!TRANSITIONS[current.status]?.includes(status)) {
      return NextResponse.json(
        { success: false, error: `A request that is ${current.status.toLowerCase().replace(/_/g, ' ')} can't be marked ${status.toLowerCase().replace(/_/g, ' ')}.` },
        { status: 422 }
      )
    }

    const updated = await prisma.customOrder.update({ where: { id }, data: { status } })
    await prisma.auditLog.create({
      data: { actorId: session.userId, action: 'UPDATE', entityType: 'CustomOrder', entityId: id, diff: { before: current.status, after: status } },
    })
    return ok(updated)
  } catch (error) {
    return apiError(error)
  }
}
