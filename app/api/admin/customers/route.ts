import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/customers — List registered customers & brides
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'orders:read')

    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      include: {
        orders: { select: { totalPaise: true } },
        customOrders: { select: { weddingDate: true }, take: 1, orderBy: { createdAt: 'desc' } },
        addresses: { select: { city: true }, take: 1 },
      },
    })

    const data = users.map((u) => {
      const totalSpentPaise = u.orders.reduce((sum, o) => sum + o.totalPaise, 0)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ?? '+91 98402 12345',
        city: u.addresses[0]?.city ?? 'Kanyakumari',
        ordersCount: u.orders.length,
        totalSpent: Math.round(totalSpentPaise / 100),
        weddingDate: u.customOrders[0]?.weddingDate ?? 'Upcoming 2026',
      }
    })

    return ok(data)
  } catch (error) {
    return apiError(error)
  }
}

