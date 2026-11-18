import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/db'

type Db = PrismaClient | Prisma.TransactionClient

/** Keep Product.rating / reviewCount in step with approved (visible) reviews. */
export async function recalcProductRating(productId: string, db: Db = prisma) {
  const agg = await db.review.aggregate({
    where: { productId, visible: true },
    _avg: { rating: true },
    _count: { _all: true },
  })
  await db.product.update({
    where: { id: productId },
    data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count._all },
  })
}

/** Approved review stats for many products at once (storefront lists). */
export async function ratingsFor(productIds: string[]): Promise<Map<string, { rating: number; count: number }>> {
  if (productIds.length === 0) return new Map()
  const rows = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds }, visible: true },
    _avg: { rating: true },
    _count: { _all: true },
  })
  return new Map(rows.map((r) => [r.productId, { rating: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count._all }]))
}
