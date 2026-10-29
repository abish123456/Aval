import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/reviews — Submit a review (defaults to hidden pending approval)
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(5).max(1000),
  guestName: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    const body = reviewSchema.parse(await req.json())

    // Check if user bought this product for verified purchase badge
    let verifiedPurchase = false
    if (session?.userId) {
      const orderWithProduct = await prisma.order.findFirst({
        where: {
          userId: session.userId,
          paymentStatus: 'PAID',
          items: {
            some: { productId: body.productId },
          },
        },
      })
      if (orderWithProduct) verifiedPurchase = true
    }

    const review = await prisma.review.create({
      data: {
        productId: body.productId,
        userId: session?.userId,
        guestName: body.guestName ?? 'Customer',
        rating: body.rating,
        body: body.body,
        verifiedPurchase,
        visible: false, // Moderated by default
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Review submitted and awaiting artisan review.',
        data: review,
      },
      { status: 201 }
    )
  } catch (error) {
    return apiError(error)
  }
}
