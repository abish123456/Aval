import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'
import { productFields, slugify, uniqueSlug } from '@/src/server/products'

// Stock is changed through Inventory (so every change is logged), not here.
const updateSchema = z
  .object({
    ...productFields,
    archived: z.boolean(),
  })
  .partial()

// ---------------------------------------------------------------------------
// PATCH /api/admin/products/[id]
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'products:write')

    const { id } = await ctx.params
    const body = updateSchema.parse(await req.json())

    const current = await prisma.product.findUnique({
      where: { id },
      select: { name: true, slug: true, regularPricePaise: true, salePricePaise: true },
    })
    if (!current) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })

    const regular = body.regularPricePaise ?? current.regularPricePaise
    const sale = body.salePricePaise ?? current.salePricePaise
    if (sale > regular) {
      return NextResponse.json(
        { success: false, error: 'The selling price can’t be higher than the regular price' },
        { status: 422 }
      )
    }
    if (body.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: body.categoryId }, select: { id: true } })
      if (!category) {
        return NextResponse.json({ success: false, error: 'That category no longer exists. Pick another one.' }, { status: 422 })
      }
    }

    // Keep the URL in step with a renamed product
    const slug = body.name && body.name !== current.name ? await uniqueSlug(slugify(body.name), id) : undefined

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: { ...body, ...(slug ? { slug } : {}) },
        include: { category: { select: { id: true, name: true, slug: true } } },
      })
      await tx.auditLog.create({
        data: { actorId: session.userId, action: 'UPDATE', entityType: 'Product', entityId: id, diff: { changed: Object.keys(body) } },
      })
      return p
    })

    return ok(updated)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/products/[id]
// Products with any history (orders, stock movements, reviews) are hidden
// (archived) instead, so past records keep their product. Others are deleted.
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'products:write')

    const { id } = await ctx.params
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { orderItems: true, inventoryMovements: true, reviews: true } },
      },
    })
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })

    const enquiryUses = await prisma.enquiry.count({ where: { items: { array_contains: [{ productId: id }] } } })
    const hasHistory =
      enquiryUses > 0 ||
      product._count.orderItems > 0 ||
      product._count.inventoryMovements > 0 ||
      product._count.reviews > 0

    if (hasHistory) {
      await prisma.$transaction([
        prisma.product.update({ where: { id }, data: { archived: true } }),
        prisma.auditLog.create({ data: { actorId: session.userId, action: 'ARCHIVE', entityType: 'Product', entityId: id } }),
      ])
      return ok({ archived: true, id })
    }

    await prisma.$transaction([
      prisma.wishlist.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
      prisma.auditLog.create({ data: { actorId: session.userId, action: 'DELETE', entityType: 'Product', entityId: id } }),
    ])
    return ok({ deleted: true, id })
  } catch (error) {
    return apiError(error)
  }
}
