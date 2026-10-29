import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/categories — List all categories
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'categories:read')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      description: c.description,
      archived: c.archived,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
    }))

    return ok(data)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/categories — Create category
// ---------------------------------------------------------------------------

const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  image: z.string().default('/images/hero_bangles.jpg'),
  description: z.string().default(''),
  sortOrder: z.number().int().default(0),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'categories:write')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const raw = await req.json()
    if (!raw.slug && raw.name) {
      raw.slug = raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    const body = createCategorySchema.parse(raw)

    const existing = await prisma.category.findUnique({ where: { slug: body.slug } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: body,
    })

    const actorId = session?.userId ?? 'admin-dev'
    try {
      await prisma.auditLog.create({
        data: {
          actorId,
          action: 'CREATE',
          entityType: 'Category',
          entityId: category.id,
        },
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
