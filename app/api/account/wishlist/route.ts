import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/account/wishlist — List wishlist items with product details
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            regularPricePaise: true,
            salePricePaise: true,
            stock: true,
            images: true,
            rating: true,
            reviewCount: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
    })

    return ok(wishlist.map((w) => w.product))
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/account/wishlist — Add product to wishlist
// ---------------------------------------------------------------------------

const addSchema = z.object({
  productId: z.string(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const { productId } = addSchema.parse(await req.json())

    const item = await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId: session.userId,
          productId,
        },
      },
      create: {
        userId: session.userId,
        productId,
      },
      update: {},
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/account/wishlist?productId=... — Remove from wishlist
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    if (!productId) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 })

    await prisma.wishlist.deleteMany({
      where: { userId: session.userId, productId },
    })

    return ok({ deleted: true })
  } catch (error) {
    return apiError(error)
  }
}

