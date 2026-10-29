import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  categoryId: z.string().optional(),
  regularPricePaise: z.number().int().positive().optional(),
  salePricePaise: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  customisable: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  description: z.string().optional(),
  details: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// PATCH /api/admin/products/[id] — Update an existing product
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'products:write')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const { id } = await ctx.params
    const raw = await req.json()
    const body = updateProductSchema.parse(raw)

    const updated = await prisma.product.update({
      where: { id },
      data: body,
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    const actorId = session?.userId ?? 'admin-dev'
    try {
      await prisma.auditLog.create({
        data: { actorId, action: 'UPDATE', entityType: 'Product', entityId: id },
      })
    } catch {
      // Non-fatal if audit fails in dev
    }

    return ok(updated)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/products/[id] — Delete product
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'products:write')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const { id } = await ctx.params
    await prisma.product.delete({ where: { id } })

    const actorId = session?.userId ?? 'admin-dev'
    try {
      await prisma.auditLog.create({
        data: { actorId, action: 'DELETE', entityType: 'Product', entityId: id },
      })
    } catch {
      // Non-fatal
    }

    return ok({ deleted: true, id })
  } catch (error) {
    return apiError(error)
  }
}
