import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError, getPagination } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/products
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'products:read')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const { searchParams } = new URL(req.url)
    const { skip, take, page, pageSize } = getPagination(searchParams, 50)
    const archived = searchParams.get('archived') === 'true'
    const search = searchParams.get('search')?.trim()

    const where: Prisma.ProductWhereInput = { archived }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
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

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  categoryId: z.string(),
  regularPricePaise: z.number().int().positive(),
  salePricePaise: z.number().int().positive(),
  stock: z.number().int().min(0),
  customisable: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  description: z.string().default(''),
  details: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'products:write')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const raw = await req.json()
    // Auto-generate slug if missing
    if (!raw.slug && raw.name) {
      raw.slug = raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    // Verify category exists or fallback to first category
    if (raw.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: raw.categoryId } })
      if (!cat) {
        const firstCat = await prisma.category.findFirst()
        if (firstCat) raw.categoryId = firstCat.id
      }
    } else {
      const firstCat = await prisma.category.findFirst()
      if (firstCat) raw.categoryId = firstCat.id
    }

    const body = productSchema.parse(raw)
    const product = await prisma.product.create({
      data: body,
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    const actorId = session?.userId ?? 'admin-dev'
    try {
      await prisma.auditLog.create({
        data: { actorId, action: 'CREATE', entityType: 'Product', entityId: product.id },
      })
    } catch {
      // Non-fatal if audit log fails in dev
    }

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
