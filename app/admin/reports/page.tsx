'use client'

import { useState } from 'react'
import { PageHeader, Kpi, KpiGrid, Notice, STATUS_LABEL, rupees, useAdminData } from '../_components/ui'

type Range = 'last7' | 'last30' | 'thisYear'

interface Report {
  grossSalesPaise: number
  discountPaise: number
  shippingPaise: number
  collectedPaise: number
  netRevenuePaise: number
  paidOrders: number
  totalOrders: number
  averageOrderPaise: number
  topProducts: { name: string; sold: number; revenuePaise: number }[]
  statusCounts: { status: string; count: number }[]
  series: { label: string; revenuePaise: number; orders: number }[]
}

const RANGE_LABEL: Record<Range, string> = { last7: 'Last 7 days', last30: 'Last 30 days', thisYear: 'This year' }

export default function AdminReportsPage() {
  const [range, setRange] = useState<Range>('last30')
  const { data, error, loading } = useAdminData<Report>(`/api/admin/reports?range=${range}`)
  const maxRevenue = Math.max(1, ...(data?.series.map((s) => s.revenuePaise) ?? [0]))

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Paid, non-cancelled orders. Revenue excludes shipping unless stated."
        actions={
          <>
            <label htmlFor="report-range" style={{ fontSize: '13px', color: 'var(--tx2)' }}>Period</label>
            <select id="report-range" className="input" value={range} onChange={(e) => setRange(e.target.value as Range)} style={{ fontSize: '13px', padding: '8px 12px', width: 'auto' }}>
              {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                <option key={r} value={r}>{RANGE_LABEL[r]}</option>
              ))}
            </select>
            {/* A real link so the browser downloads the CSV with the session cookie */}
            <a className="btn btn-outline btn-sm" href={`/api/admin/reports?format=csv&range=${range}`}>Export CSV</a>
          </>
        }
      />

      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : loading && !data ? (
        <Notice>Loading report…</Notice>
      ) : data ? (
        <>
          <KpiGrid>
            <Kpi label="Gross sales" value={rupees(data.grossSalesPaise)} />
            <Kpi label="Coupon discounts" value={rupees(data.discountPaise)} />
            <Kpi label="Net revenue" value={rupees(data.netRevenuePaise)} hint="gross − discounts" />
            <Kpi label="Shipping collected" value={rupees(data.shippingPaise)} />
            <Kpi label="Paid orders" value={String(data.paidOrders)} hint={`${data.totalOrders} placed · avg ${rupees(data.averageOrderPaise)}`} />
          </KpiGrid>

          <div className="admin-two-col-grid">
            <div className="card" style={{ padding: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', margin: '0 0 16px' }}>Revenue collected</h2>
              {data.series.every((s) => s.revenuePaise === 0) ? (
                <p style={{ color: 'var(--tx2)', fontSize: '14px' }}>No paid orders in this period.</p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px', overflowX: 'auto' }} role="img" aria-label="Revenue by period">
                  {data.series.map((s) => (
                    <div key={s.label} style={{ flex: '1 0 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                      <div title={`${s.label}: ${rupees(s.revenuePaise)} · ${s.orders} orders`} style={{ width: '100%', maxWidth: '36px', height: `${Math.max(2, (s.revenuePaise / maxRevenue) * 140)}px`, background: 'var(--pr)', borderRadius: '3px 3px 0 0' }} />
                      <div style={{ fontSize: '11px', color: 'var(--tx2)', whiteSpace: 'nowrap' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', margin: '0 0 16px' }}>Orders by status</h2>
              <table className="data-table" style={{ minWidth: 0 }}>
                <tbody>
                  {data.statusCounts.map((s) => (
                    <tr key={s.status}>
                      <td>{STATUS_LABEL[s.status] ?? s.status}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', margin: '0 0 12px' }}>Top products</h2>
            {data.topProducts.length === 0 ? (
              <p style={{ color: 'var(--tx2)', fontSize: '14px' }}>No paid orders in this period.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Product</th><th style={{ textAlign: 'right' }}>Units</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.sold}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rupees(p.revenuePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
