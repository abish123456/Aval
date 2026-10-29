import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, apiError } from '@/src/server/api/helpers'
import { NotFoundError } from '@/src/server/auth/rbac'

// ---------------------------------------------------------------------------
// GET /api/products/[slug]
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug, archived: false },
      include: {
        category: { select: { name: true, slug: true } },
        reviews: {
          where: { visible: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            rating: true,
            body: true,
            guestName: true,
            verifiedPurchase: true,
            artisanReply: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
      },
    })

    if (!product) throw new NotFoundError('Product')

    return ok(product)
  } catch (error) {
    return apiError(error)
  }
}

