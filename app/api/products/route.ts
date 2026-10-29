import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ok, apiError, getPagination } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/products
// Query params: category, search, sort, page, pageSize
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const { skip, take, page, pageSize } = getPagination(searchParams)

    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')?.trim()
    const sort = searchParams.get('sort') ?? 'featured'
    const featured = searchParams.get('featured') === 'true'

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      archived: false,
    }

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (featured) {
      where.OR = [{ isBestSeller: true }, { isNew: true }]
    }

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (sort) {
        case 'price-asc': return { salePricePaise: 'asc' as const }
        case 'price-desc': return { salePricePaise: 'desc' as const }
        case 'newest': return { createdAt: 'desc' as const }
        case 'rating': return { rating: 'desc' as const }
        default: return { isBestSeller: 'desc' as const }
      }
    })()

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          regularPricePaise: true,
          salePricePaise: true,
          stock: true,
          customisable: true,
          isBestSeller: true,
          isNew: true,
          rating: true,
          reviewCount: true,
          images: true,
          sizes: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return ok({ data: products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    return apiError(error)
  }
}

