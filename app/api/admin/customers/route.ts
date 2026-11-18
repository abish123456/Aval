import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/customers — customers derived from their orders (enquiries),
// grouped by WhatsApp number. No invented defaults: missing data stays empty.
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'customers:read')

    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        token: true,
        customerName: true,
        customerPhone: true,
        customerWhatsapp: true,
        deliveryAddress: true,
        status: true,
        paymentStatus: true,
        totalPaise: true,
        createdAt: true,
      },
    })

    const byPhone = new Map<
      string,
      { id: string; name: string; phone: string; whatsapp: string; city: string; ordersCount: number; totalSpentPaise: number; lastOrderAt: Date; lastToken: string }
    >()
    for (const e of enquiries) {
      // enquiries are newest first, so the first row per customer holds their latest details
      let row = byPhone.get(e.customerWhatsapp)
      if (!row) {
        const address = (e.deliveryAddress ?? {}) as { city?: string }
        row = {
          id: e.customerWhatsapp,
          name: e.customerName,
          phone: e.customerPhone,
          whatsapp: e.customerWhatsapp,
          city: address.city ?? '',
          ordersCount: 0,
          totalSpentPaise: 0,
          lastOrderAt: e.createdAt,
          lastToken: e.token,
        }
        byPhone.set(e.customerWhatsapp, row)
      }
      if (e.status !== 'CANCELLED') row.ordersCount += 1
      if (e.paymentStatus === 'PAID' && e.status !== 'CANCELLED') row.totalSpentPaise += e.totalPaise
    }

    return ok([...byPhone.values()])
  } catch (error) {
    return apiError(error)
  }
}
