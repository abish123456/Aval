import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/admin/inventory/adjust — Change stock by a delta, with a reason.
// Uses an atomic increment/decrement, so an order placed at the same moment
// can never be overwritten. Stock can't go below zero.
// ---------------------------------------------------------------------------

const REASONS = ['RESTOCK', 'ADJUSTMENT', 'DAMAGED', 'RETURN'] as const

const adjustSchema = z.object({
  productId: z.string().min(1),
  delta: z.number().int().refine((d) => d !== 0, 'Enter a change other than 0').refine((d) => Math.abs(d) <= 10_000, 'That change is too large'),
  reason: z.enum(REASONS).optional(),
  note: z.string().trim().max(200).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'inventory:adjust')

    const body = adjustSchema.parse(await req.json())

    const result = await prisma.$transaction(async (tx) => {
      const changed = await tx.product.updateMany({
        where: { id: body.productId, ...(body.delta < 0 ? { stock: { gte: -body.delta } } : {}) },
        data: { stock: { increment: body.delta } },
      })
      if (changed.count === 0) {
        const exists = await tx.product.findUnique({ where: { id: body.productId }, select: { stock: true } })
        if (!exists) throw new Error('NOT_FOUND')
        throw new Error(`NOT_ENOUGH:${exists.stock}`)
      }

      const product = await tx.product.findUniqueOrThrow({
        where: { id: body.productId },
        select: { id: true, name: true, stock: true },
      })

      await tx.inventoryMovement.create({
        data: {
          productId: body.productId,
          delta: body.delta,
          reason: body.reason ?? (body.delta > 0 ? 'RESTOCK' : 'ADJUSTMENT'),
          note: body.note || 'Manual stock adjustment',
          actorId: session.userId,
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'UPDATE',
          entityType: 'ProductStock',
          entityId: body.productId,
          diff: { delta: body.delta, newStock: product.stock, reason: body.reason ?? null },
        },
      })

      return product
    })

    return ok(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }
    if (error instanceof Error && error.message.startsWith('NOT_ENOUGH:')) {
      return NextResponse.json(
        { success: false, error: `Only ${error.message.split(':')[1]} in stock, so it can't go down by that much.` },
        { status: 409 }
      )
    }
    return apiError(error)
  }
}
