import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/reports — Aggregated financial figures & sales stats
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'reports:read')

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') ?? 'last30' // last7, last30, thisYear
    const format = searchParams.get('format')

    const now = new Date()
    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    if (range === 'last7') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (range === 'thisYear') {
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: 'PAID',
        fulfilmentStatus: { not: 'CANCELLED' },
      },
      include: {
        items: true,
      },
    })

    const refunds = await prisma.refund.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'PROCESSED',
      },
    })

    const grossSalesPaise = orders.reduce((sum, o) => sum + o.subtotalPaise, 0)
    const discountPaise = orders.reduce((sum, o) => sum + o.discountPaise, 0)
    const shippingPaise = orders.reduce((sum, o) => sum + o.shippingPaise, 0)
    const taxPaise = orders.reduce((sum, o) => sum + o.taxPaise, 0)
    const refundsPaise = refunds.reduce((sum, r) => sum + r.amountPaise, 0)
    const netRevenuePaise = grossSalesPaise - discountPaise - refundsPaise

    // Top products by revenue
    const productStats: Record<string, { name: string; sold: number; revenuePaise: number }> = {}
    for (const order of orders) {
      for (const item of order.items) {
        const snap = item.snapshotJson as { name?: string }
        const name = snap?.name ?? 'Bridal Item'
        if (!productStats[name]) {
          productStats[name] = { name, sold: 0, revenuePaise: 0 }
        }
        productStats[name].sold += item.qty
        productStats[name].revenuePaise += item.lineTotalPaise
      }
    }

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 5)

    // Order status counts
    const statusCounts = await prisma.order.groupBy({
      by: ['fulfilmentStatus'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    })

    // CSV format output
    if (format === 'csv') {
      const rows = [
        ['Metric', 'Value (INR)'],
        ['Gross Sales', (grossSalesPaise / 100).toFixed(2)],
        ['Discounts Applied', (discountPaise / 100).toFixed(2)],
        ['Refunds Issued', (refundsPaise / 100).toFixed(2)],
        ['Shipping Collected', (shippingPaise / 100).toFixed(2)],
        ['Net Revenue', (netRevenuePaise / 100).toFixed(2)],
        [],
        ['Top Products', 'Units Sold', 'Revenue (INR)'],
        ...topProducts.map((p) => [p.name, p.sold.toString(), (p.revenuePaise / 100).toFixed(2)]),
      ]
      const csv = rows.map((r) => r.join(',')).join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="aval-report.csv"',
        },
      })
    }

    return ok({
      range,
      grossSalesPaise,
      discountPaise,
      shippingPaise,
      taxPaise,
      refundsPaise,
      netRevenuePaise,
      totalOrders: orders.length,
      topProducts,
      statusCounts: statusCounts.map((s) => ({ status: s.fulfilmentStatus, count: s._count.id })),
    })
  } catch (error) {
    return apiError(error)
  }
}

