import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/categories — Public list of active categories
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const categories = await prisma.category.findMany({
      where: { archived: false },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { archived: false },
            },
          },
        },
      },
    })

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      description: c.description,
      itemCount: c._count.products,
      sortOrder: c.sortOrder,
    }))

    return ok(data)
  } catch (error) {
    return apiError(error)
  }
}

