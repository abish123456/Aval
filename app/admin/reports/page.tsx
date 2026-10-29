'use client'

import { useState } from 'react'

type DateRange = 'last7' | 'last30' | 'thisYear'

interface WeekData {
  label: string
  value: number
}

const WEEK_DATA: WeekData[] = [
  { label: 'W1', value: 60 },
  { label: 'W2', value: 45 },
  { label: 'W3', value: 80 },
  { label: 'W4', value: 70 },
  { label: 'W5', value: 95 },
  { label: 'W6', value: 88 },
  { label: 'W7', value: 100 },
]

const SCALE = 1800 // ₹ per unit

const TOP_PRODUCTS = [
  { name: 'Kundan Bridal Bangle Set', sold: 47, revenue: 56400 },
  { name: 'Maangtika Kundan Gold', sold: 38, revenue: 38000 },
  { name: 'Temple Jewellery Earrings', sold: 29, revenue: 21750 },
  { name: 'Pearl Hair Clip', sold: 22, revenue: 8800 },
  { name: 'Bridal Combo Set', sold: 14, revenue: 35000 },
]

const ORDER_STATUS_BREAKDOWN = [
  { label: 'Delivered', count: 74, color: 'var(--ok)' },
  { label: 'Processing', count: 12, color: 'var(--wn)' },
  { label: 'Shipped', count: 8, color: '#6366f1' },
  { label: 'Cancelled', count: 4, color: '#ef4444' },
  { label: 'Custom Orders', count: 7, color: 'var(--pr)' },
]

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function downloadCSV(range: string) {
  const link = document.createElement('a')
  link.href = `/api/admin/reports?format=csv&range=${range}`
  link.setAttribute('download', 'aval-report.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  thisYear: 'This year',
}

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('last30')

  const maxVal = Math.max(...WEEK_DATA.map((w) => w.value))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--dk)',
              margin: 0,
            }}
          >
            Reports &amp; Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--tx2)', margin: '4px 0 0' }}>
            Financial summary, sales trends, and product performance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="input"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            style={{ fontSize: '13px', padding: '8px 12px' }}
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="thisYear">This year</option>
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => downloadCSV(dateRange)}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Main 2-col Grid */}
      <div className="admin-two-col-grid">

        {/* LEFT: Financial Summary + Top Products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Financial Summary */}
          <div className="card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--dk)', margin: 0 }}>
                Financial Summary
              </h2>
              <span className="tag" style={{ fontSize: '11px' }}>{DATE_RANGE_LABELS[dateRange]}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { label: 'Gross Sales', value: 184500, type: 'positive' as const },
                { label: 'Discounts Applied', value: -21300, type: 'negative' as const },
                { label: 'Refunds Issued', value: -4200, type: 'negative' as const },
                { label: 'Shipping Collected', value: 6800, type: 'positive' as const },
                { label: 'GST (incl. in price)', value: 0, type: 'neutral' as const },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '11px 0',
                    borderBottom: '1px solid var(--bd)',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ color: 'var(--tx2)' }}>{row.label}</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: row.type === 'negative' ? '#dc2626' : row.type === 'positive' ? 'var(--tx)' : 'var(--tx2)',
                    }}
                  >
                    {row.value === 0 ? '₹0' : fmt(Math.abs(row.value))}
                    {row.type === 'negative' && row.value !== 0 ? ' (deducted)' : ''}
                  </span>
                </div>
              ))}

              {/* Net Revenue */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0 0',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--dk)',
                }}
              >
                <span>Net Revenue</span>
                <span style={{ color: 'var(--ok)', fontSize: '20px' }}>{fmt(159000)}</span>
              </div>
            </div>

            <p
              style={{
                marginTop: '14px',
                fontSize: '11px',
                color: 'var(--tx2)',
                fontStyle: 'italic',
                padding: '8px 12px',
                background: '#F8F6F4',
                borderRadius: '6px',
              }}
            >
              Sample figures. Real values will be computed from the orders database after launch.
            </p>
          </div>

          {/* Top Products */}
          <div className="card" style={{ padding: '24px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--dk)',
                margin: '0 0 16px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              Top Products by Revenue
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {TOP_PRODUCTS.map((p, i) => {
                const maxRevenue = TOP_PRODUCTS[0].revenue
                const pct = Math.round((p.revenue / maxRevenue) * 100)
                return (
                  <div key={p.name}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: i === 0 ? '#f59e0b' : i === 1 ? '#d1d5db' : '#cd7f32',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--tx)' }}>{p.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)' }}>{fmt(p.revenue)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>{p.sold} sold</div>
                      </div>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bd)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'var(--pr)',
                          borderRadius: '2px',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="card" style={{ padding: '24px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--dk)',
                margin: '0 0 16px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              Orders by Status
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ORDER_STATUS_BREAKDOWN.map((s) => {
                const total = ORDER_STATUS_BREAKDOWN.reduce((a, b) => a + b.count, 0)
                const pct = Math.round((s.count / total) * 100)
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--tx)', flex: 1 }}>{s.label}</span>
                    <div style={{ flex: 2, height: '6px', background: 'var(--bd)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: s.color,
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)', minWidth: '28px', textAlign: 'right' }}>
                      {s.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Weekly Sales Chart + KPIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Weekly Sales Chart */}
          <div className="card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--dk)', margin: 0 }}>
                Weekly Sales Trend
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>Oct 2026</span>
            </div>

            {/* Bar Chart */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
                height: '160px',
                padding: '0 4px',
              }}
            >
              {WEEK_DATA.map((w) => {
                const heightPct = (w.value / maxVal) * 100
                const rupees = w.value * SCALE
                return (
                  <div
                    key={w.label}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9px',
                        color: 'var(--tx2)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {(rupees / 1000).toFixed(0)}k
                    </div>
                    <div
                      title={`${w.label}: ₹${rupees.toLocaleString('en-IN')}`}
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: w.value === maxVal
                          ? 'var(--pr)'
                          : 'linear-gradient(to top, var(--pr), #c4435d)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                        opacity: w.value === maxVal ? 1 : 0.72,
                        cursor: 'default',
                        minHeight: '8px',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--tx2)', fontWeight: 500 }}>{w.label}</div>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: '#F8F6F4',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>Best week</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--pr)' }}>
                W7 — {fmt(maxVal * SCALE)}
              </span>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Total Orders', value: '105', sub: 'this period', icon: '📦' },
              { label: 'Avg Order Value', value: '₹1,757', sub: 'per order', icon: '💰' },
              { label: 'Repeat Customers', value: '34%', sub: 'return rate', icon: '❤️' },
              { label: 'Custom Requests', value: '7', sub: 'in pipeline', icon: '✍️' },
            ].map((kpi) => (
              <div key={kpi.label} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '22px' }}>{kpi.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dk)', lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)' }}>{kpi.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Channels Breakdown */}
          <div className="card" style={{ padding: '24px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--dk)',
                margin: '0 0 16px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              Sales Channels
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { channel: 'Online Store (Web)', pct: 62, revenue: 98580 },
                { channel: 'WhatsApp Direct', pct: 24, revenue: 38280 },
                { channel: 'Custom Orders', pct: 14, revenue: 22260 },
              ].map((c) => (
                <div key={c.channel}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '5px',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--tx)' }}>{c.channel}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)' }}>{fmt(c.revenue)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--tx2)', marginLeft: '6px' }}>({c.pct}%)</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bd)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${c.pct}%`,
                        background: 'var(--pr)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Note */}
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(235,211,207,0.2)',
              border: '1px solid var(--bd)',
              borderRadius: '10px',
              fontSize: '13px',
              color: 'var(--tx2)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>📋</span>
            <div>
              <strong style={{ color: 'var(--dk)' }}>CSV Export</strong> includes the financial summary, weekly sales, and top products breakdown.
              Click <strong>Export CSV</strong> above to download <code>aval-report.csv</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

