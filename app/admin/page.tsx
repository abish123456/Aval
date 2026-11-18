'use client'

import Link from 'next/link'
import { PageHeader, Kpi, KpiGrid, Notice, StatusTag, rupees, formatDate, useAdminData } from './_components/ui'

interface Report {
  collectedPaise: number
  paidOrders: number
  totalOrders: number
  averageOrderPaise: number
  awaitingPayment: number
  inProduction: number
  refundsDue: number
}

interface EnquiryRow {
  token: string
  customerName: string
  status: string
  paymentStatus: string
  totalPaise: number
  createdAt: string
  items: Array<{ productName: string; qty: number }>
}

export default function AdminDashboardPage() {
  const report = useAdminData<Report>('/api/admin/reports?range=last30')
  const recent = useAdminData<{ enquiries: EnquiryRow[] }>('/api/admin/enquiries?limit=8')

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Last 30 days of bridal orders"
        actions={
          <>
            <Link href="/admin/products" className="btn btn-outline btn-sm">Add product</Link>
            <Link href="/admin/enquiries" className="btn btn-primary btn-sm">Manage orders</Link>
          </>
        }
      />

      {report.error ? (
        <Notice kind="error">{report.error}</Notice>
      ) : (
        <KpiGrid>
          <Kpi label="Revenue collected" value={report.data ? rupees(report.data.collectedPaise) : '…'} hint={report.data ? `${report.data.paidOrders} paid orders` : undefined} />
          <Kpi label="Orders placed" value={report.data ? String(report.data.totalOrders) : '…'} hint="including unpaid" />
          <Kpi label="Awaiting payment" value={report.data ? String(report.data.awaitingPayment) : '…'} />
          <Kpi label="In production" value={report.data ? String(report.data.inProduction) : '…'} />
          <Kpi label="Average order" value={report.data ? rupees(report.data.averageOrderPaise) : '…'} />
        </KpiGrid>
      )}

      {report.data && report.data.refundsDue > 0 && (
        <div role="alert" className="card" style={{ padding: '14px 18px', marginBottom: '24px', color: 'var(--er)', fontSize: '14px' }}>
          {report.data.refundsDue} cancelled order{report.data.refundsDue > 1 ? 's were' : ' was'} paid and need{report.data.refundsDue > 1 ? '' : 's'} a refund.{' '}
          <Link href="/admin/enquiries">Review</Link>
        </div>
      )}

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', margin: 0 }}>Recent orders</h2>
          <Link href="/admin/enquiries" style={{ fontSize: '13px' }}>View all</Link>
        </div>

        {recent.loading ? (
          <p style={{ color: 'var(--tx2)', fontSize: '14px' }}>Loading…</p>
        ) : recent.error ? (
          <p role="alert" style={{ color: 'var(--er)', fontSize: '14px' }}>{recent.error}</p>
        ) : !recent.data?.enquiries.length ? (
          <p style={{ color: 'var(--tx2)', fontSize: '14px' }}>No orders yet. New orders from the storefront appear here.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.enquiries.map((e) => (
                  <tr key={e.token}>
                    <td>
                      <Link href={`/admin/enquiries?token=${e.token}`} style={{ fontFamily: 'monospace' }}>{e.token}</Link>
                      <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>{formatDate(e.createdAt)}</div>
                    </td>
                    <td>{e.customerName}</td>
                    <td style={{ fontSize: '13px' }}>
                      {e.items[0]?.productName}
                      {e.items.length > 1 && <span style={{ color: 'var(--tx2)' }}> +{e.items.length - 1} more</span>}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{rupees(e.totalPaise)}</td>
                    <td><span className={`tag ${e.paymentStatus === 'PAID' ? 'tag-ok' : 'tag-warning'}`}>{e.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}</span></td>
                    <td><StatusTag status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
