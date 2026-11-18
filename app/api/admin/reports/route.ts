import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/reports?range=last7|last30|thisYear[&format=csv]
// Figures come from enquiries (the live order flow).
//   Gross sales  = Σ subtotal of paid, non-cancelled orders
//   Net revenue  = gross − coupon discounts (shipping shown separately)
// ---------------------------------------------------------------------------

type Range = 'last7' | 'last30' | 'thisYear'

interface Line {
  productName?: string
  productId?: string
  qty?: number
  unitPaise?: number
}

function rangeStart(range: Range, now: Date): Date {
  if (range === 'last7') return new Date(now.getTime() - 7 * 86400000)
  if (range === 'thisYear') return new Date(now.getFullYear(), 0, 1)
  return new Date(now.getTime() - 30 * 86400000)
}

/** Buckets for the revenue chart: days (7d), weeks (30d) or months (year). */
function buckets(range: Range, start: Date, now: Date) {
  const out: { label: string; from: Date; to: Date; revenuePaise: number; orders: number }[] = []
  if (range === 'thisYear') {
    for (let m = 0; m <= now.getMonth(); m++) {
      const from = new Date(now.getFullYear(), m, 1)
      out.push({ label: from.toLocaleString('en-IN', { month: 'short' }), from, to: new Date(now.getFullYear(), m + 1, 1), revenuePaise: 0, orders: 0 })
    }
    return out
  }
  const step = range === 'last7' ? 86400000 : 7 * 86400000
  for (let t = start.getTime(); t < now.getTime(); t += step) {
    const from = new Date(t)
    out.push({
      label: range === 'last7' ? from.toLocaleDateString('en-IN', { weekday: 'short' }) : from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      from,
      to: new Date(Math.min(t + step, now.getTime() + 1)),
      revenuePaise: 0,
      orders: 0,
    })
  }
  return out
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'reports:read')

    const { searchParams } = new URL(req.url)
    const raw = searchParams.get('range')
    const range: Range = raw === 'last7' || raw === 'thisYear' ? raw : 'last30'
    const format = searchParams.get('format')

    const now = new Date()
    const start = rangeStart(range, now)

    const enquiries = await prisma.enquiry.findMany({
      where: { createdAt: { gte: start } },
      select: {
        createdAt: true,
        status: true,
        paymentStatus: true,
        items: true,
        subtotalPaise: true,
        discountPaise: true,
        shippingPaise: true,
        totalPaise: true,
      },
    })

    const paid = enquiries.filter((e) => e.paymentStatus === 'PAID' && e.status !== 'CANCELLED')
    const grossSalesPaise = paid.reduce((s, e) => s + e.subtotalPaise, 0)
    const discountPaise = paid.reduce((s, e) => s + e.discountPaise, 0)
    const shippingPaise = paid.reduce((s, e) => s + e.shippingPaise, 0)
    const collectedPaise = paid.reduce((s, e) => s + e.totalPaise, 0)
    const netRevenuePaise = grossSalesPaise - discountPaise
    const refundsDue = enquiries.filter((e) => e.paymentStatus === 'PAID' && e.status === 'CANCELLED').length

    const productStats = new Map<string, { name: string; sold: number; revenuePaise: number }>()
    for (const e of paid) {
      for (const l of (Array.isArray(e.items) ? e.items : []) as Line[]) {
        const name = (l.productName ?? 'Item').replace(/ \(Custom: .*\)$/, '')
        const row = productStats.get(name) ?? { name, sold: 0, revenuePaise: 0 }
        row.sold += l.qty ?? 0
        row.revenuePaise += (l.unitPaise ?? 0) * (l.qty ?? 0)
        productStats.set(name, row)
      }
    }
    const topProducts = [...productStats.values()].sort((a, b) => b.revenuePaise - a.revenuePaise).slice(0, 5)

    const statusCounts = ['ENQUIRY', 'CONFIRMED', 'MAKING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((status) => ({
      status,
      count: enquiries.filter((e) => e.status === status).length,
    }))

    const series = buckets(range, start, now)
    for (const e of paid) {
      const b = series.find((x) => e.createdAt >= x.from && e.createdAt < x.to)
      if (b) {
        b.revenuePaise += e.totalPaise
        b.orders += 1
      }
    }

    if (format === 'csv') {
      const rows = [
        ['Metric', 'Value (INR)'],
        ['Gross Sales', (grossSalesPaise / 100).toFixed(2)],
        ['Coupon Discounts', (discountPaise / 100).toFixed(2)],
        ['Net Revenue', (netRevenuePaise / 100).toFixed(2)],
        ['Shipping Collected', (shippingPaise / 100).toFixed(2)],
        ['Total Collected', (collectedPaise / 100).toFixed(2)],
        ['Paid Orders', String(paid.length)],
        [],
        ['Top Products', 'Units Sold', 'Revenue (INR)'],
        ...topProducts.map((p) => [`"${p.name.replace(/"/g, '""')}"`, String(p.sold), (p.revenuePaise / 100).toFixed(2)]),
      ]
      return new NextResponse(rows.map((r) => r.join(',')).join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="aval-report-${range}.csv"`,
        },
      })
    }

    return ok({
      range,
      grossSalesPaise,
      discountPaise,
      shippingPaise,
      collectedPaise,
      netRevenuePaise,
      paidOrders: paid.length,
      totalOrders: enquiries.length,
      averageOrderPaise: paid.length ? Math.round(collectedPaise / paid.length) : 0,
      awaitingPayment: enquiries.filter((e) => e.paymentStatus !== 'PAID' && e.status !== 'CANCELLED').length,
      inProduction: enquiries.filter((e) => e.status === 'CONFIRMED' || e.status === 'MAKING').length,
      refundsDue,
      topProducts,
      statusCounts,
      series: series.map(({ label, revenuePaise, orders }) => ({ label, revenuePaise, orders })),
    })
  } catch (error) {
    return apiError(error)
  }
}
