import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/admin/inventory/adjust — Adjust product stock
// ---------------------------------------------------------------------------

const adjustSchema = z.object({
  productId: z.string(),
  delta: z.number().int(),
  reason: z.string().optional(),
  note: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'inventory:adjust')

    const body = adjustSchema.parse(await req.json())

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: body.productId },
        select: { id: true, name: true, stock: true },
      })

      if (!product) {
        throw new Error(`Product ${body.productId} not found`)
      }

      const newStock = Math.max(0, product.stock + body.delta)

      const updated = await tx.product.update({
        where: { id: body.productId },
        data: { stock: newStock },
        select: { id: true, name: true, stock: true },
      })

      await tx.inventoryMovement.create({
        data: {
          product: { connect: { id: body.productId } },
          delta: body.delta,
          reason: body.reason ?? (body.delta > 0 ? 'RESTOCK' : 'ADJUSTMENT'),
          note: body.note ?? 'Manual workshop stock adjustment',
          actor: { connect: { id: session.userId } },
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'UPDATE',
          entityType: 'ProductStock',
          entityId: body.productId,
          diff: { oldStock: product.stock, newStock, delta: body.delta } as object,
        },
      })

      return updated
    })

    return ok(result)
  } catch (error) {
    return apiError(error)
  }
}

