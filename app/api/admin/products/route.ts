import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError, getPagination } from '@/src/server/api/helpers'
import { productFields, slugify, uniqueSlug } from '@/src/server/products'

// ---------------------------------------------------------------------------
// GET /api/admin/products?archived=true|false&search=&page=&pageSize=
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'products:read')

    const { searchParams } = new URL(req.url)
    const { skip, take, page, pageSize } = getPagination(searchParams, 50)
    const archived = searchParams.get('archived') === 'true'
    const search = searchParams.get('search')?.trim()

    const where: Prisma.ProductWhereInput = { archived }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ])

    return ok({ data: products, total, page, pageSize })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/products — Create product
// ---------------------------------------------------------------------------

const createSchema = z
  .object({
    ...productFields,
    stock: z.number().int().min(0).max(100_000),
    customisable: productFields.customisable.default(false),
    isBestSeller: productFields.isBestSeller.default(false),
    isNew: productFields.isNew.default(false),
    description: productFields.description.default(''),
    details: productFields.details.default([]),
    sizes: productFields.sizes.default([]),
  })
  .refine((p) => p.salePricePaise <= p.regularPricePaise, {
    message: 'The selling price can’t be higher than the regular price',
    path: ['salePricePaise'],
  })

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'products:write')

    const body = createSchema.parse(await req.json())

    const category = await prisma.category.findUnique({ where: { id: body.categoryId }, select: { id: true } })
    if (!category) {
      return NextResponse.json({ success: false, error: 'That category no longer exists. Pick another one.' }, { status: 422 })
    }

    const slug = await uniqueSlug(slugify(body.name))
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { ...body, slug },
        include: { category: { select: { id: true, name: true, slug: true } } },
      })
      if (body.stock > 0) {
        await tx.inventoryMovement.create({
          data: { productId: created.id, delta: body.stock, reason: 'RESTOCK', note: 'Opening stock', actorId: session.userId },
        })
      }
      await tx.auditLog.create({
        data: { actorId: session.userId, action: 'CREATE', entityType: 'Product', entityId: created.id },
      })
      return created
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
