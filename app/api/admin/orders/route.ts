import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError, getPagination } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/orders
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'orders:read')

    const { searchParams } = new URL(req.url)
    const { skip, take, page, pageSize } = getPagination(searchParams)
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.trim()

    const where: Prisma.OrderWhereInput = {}
    if (status) where.fulfilmentStatus = status as never
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { guestEmail: { contains: search } },
        { guestName: { contains: search } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { name: true } } } },
          payments: { select: { status: true, method: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return ok({ data: orders, total, page, pageSize })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/orders/[id]/status
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['CUSTOMISATION_IN_PROGRESS', 'READY_TO_SHIP', 'CANCELLED'],
  CUSTOMISATION_IN_PROGRESS: ['READY_TO_SHIP', 'CANCELLED'],
  READY_TO_SHIP: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURN_REQUESTED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
}

const statusSchema = z.object({
  orderId: z.string(),
  status: z.string(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  note: z.string().optional(),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'orders:update_status')

    const body = statusSchema.parse(await req.json())

    const order = await prisma.order.findUnique({ where: { id: body.orderId } })
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

    const allowed = VALID_TRANSITIONS[order.fulfilmentStatus] ?? []
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${order.fulfilmentStatus} to ${body.status}` },
        { status: 422 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: body.orderId },
        data: {
          fulfilmentStatus: body.status as never,
        },
      })

      await tx.orderStatusEvent.create({
        data: {
          orderId: body.orderId,
          fromStatus: order.fulfilmentStatus,
          toStatus: body.status,
          actorId: session.userId,
          note: body.note,
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'UPDATE',
          entityType: 'Order',
          entityId: body.orderId,
          diff: { before: { fulfilmentStatus: order.fulfilmentStatus }, after: { fulfilmentStatus: body.status } },
        },
      })
    })

    return ok({ updated: true, status: body.status })
  } catch (error) {
    return apiError(error)
  }
}

