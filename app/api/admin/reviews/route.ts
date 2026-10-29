import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/reviews — List all reviews with filters
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'reviews:read')

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') // visible, hidden, unverified

    const where: Prisma.ReviewWhereInput = {}
    if (filter === 'visible') where.visible = true
    if (filter === 'hidden') where.visible = false
    if (filter === 'unverified') where.verifiedPurchase = false

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    })

    return ok(reviews)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/reviews — Update review visibility or artisan reply
// ---------------------------------------------------------------------------

const patchSchema = z.object({
  id: z.string(),
  visible: z.boolean().optional(),
  artisanReply: z.string().optional(),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'reviews:moderate')

    const body = patchSchema.parse(await req.json())

    const review = await prisma.review.update({
      where: { id: body.id },
      data: {
        ...(typeof body.visible === 'boolean' ? { visible: body.visible } : {}),
        ...(typeof body.artisanReply === 'string' ? { artisanReply: body.artisanReply } : {}),
      },
    })

    return ok(review)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/reviews — Delete spam review
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'reviews:moderate')

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 })

    await prisma.review.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (error) {
    return apiError(error)
  }
}
