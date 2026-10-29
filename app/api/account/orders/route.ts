import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/account/orders — Customer order history
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        statusEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    return ok(orders)
  } catch (error) {
    return apiError(error)
  }
}
