import { NextRequest, NextResponse } from 'next/server'
import { cancelUnpaidOrders } from '@/src/server/orders/checkout'

// ---------------------------------------------------------------------------
// GET /api/cron/expire-orders
// Secured by CRON_SECRET header — call every 5 minutes
// Vercel Cron: {"path": "/api/cron/expire-orders", "schedule": "*/5 * * * *"}
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await cancelUnpaidOrders()
    return NextResponse.json({ success: true, cancelled: count })
  } catch (error) {
    console.error('[CRON expire-orders]', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

