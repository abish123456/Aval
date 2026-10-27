'use client'

import Link from 'next/link'
import { useState } from 'react'
import { INITIAL_ORDERS, Order } from '@/lib/data'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)

  const handleStatusChange = (orderId: string, newStatus: Order['fulfilmentStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, fulfilmentStatus: newStatus } : o))
    )
  }

  return (
    <div>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--dk)', margin: 0 }}>
            Store Performance Overview
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '14px', marginTop: '4px' }}>
            Handcrafted bridal jewellery fulfillment summary • Kanyakumari workshop
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/products" className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
            + Add New Product
          </Link>
          <button
            onClick={() => alert('Exporting monthly sales report CSV...')}
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Revenue (Oct 2026)', value: '₹1,48,250', change: '+18.4% vs last month', isPositive: true },
          { label: 'Total Orders', value: '38 orders', change: '8 custom bespoke sets', isPositive: true },
          { label: 'Pending Fulfilment', value: '4 orders', change: 'Needs artisan review', isPositive: false },
          { label: 'Average Order Value', value: '₹2,640', change: 'Top size: 2.6 Kundan', isPositive: true },
        ].map((kpi, idx) => (
          <div key={idx} className="card" style={{ padding: '22px', background: '#fff', border: '1px solid #EBE4E0' }}>
            <div style={{ fontSize: '12px', color: 'var(--tx2)', fontWeight: 500 }}>{kpi.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--dk)', margin: '8px 0 4px' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '12px', color: kpi.isPositive ? 'var(--ok)' : 'var(--pr)', fontWeight: 500 }}>
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>
              Recent Bridal Orders
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>
              Real-time customer purchases and customisation details
            </div>
          </div>
          <Link href="/admin/orders" style={{ fontSize: '13px', color: 'var(--pr)', fontWeight: 600, textDecoration: 'none' }}>
            View All Orders →
          </Link>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
                <th style={{ padding: '12px 14px' }}>Order Ref</th>
                <th style={{ padding: '12px 14px' }}>Customer</th>
                <th style={{ padding: '12px 14px' }}>Items & Customisation</th>
                <th style={{ padding: '12px 14px' }}>Amount</th>
                <th style={{ padding: '12px 14px' }}>Payment</th>
                <th style={{ padding: '12px 14px' }}>Fulfilment Status</th>
                <th style={{ padding: '12px 14px' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #F0E8E6' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--pr)' }}>
                    {o.orderNumber}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--dk)' }}>{o.customerName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>{o.phone}</div>
                    <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>{o.shippingAddress.city}</div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {o.items.map((it, i) => (
                      <div key={i} style={{ marginBottom: '4px' }}>
                        <span>{it.product.name} ({it.size}) × {it.qty}</span>
                        {it.customName && (
                          <div style={{ fontSize: '11px', color: 'var(--pr)', fontWeight: 500 }}>
                            ✍️ &ldquo;{it.customName}&rdquo; {it.weddingDate && `• ${it.weddingDate}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--dk)' }}>
                    {fmt(o.total)}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        background: '#dcefe1',
                        color: 'var(--ok)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {o.paymentStatus}
                    </span>
                    <div style={{ fontSize: '10px', color: 'var(--tx2)', marginTop: '2px' }}>
                      {o.paymentMethod}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        background:
                          o.fulfilmentStatus === 'HANDCRAFTING'
                            ? 'var(--bl2)'
                            : o.fulfilmentStatus === 'DELIVERED'
                            ? '#dcefe1'
                            : '#fbe8c8',
                        color:
                          o.fulfilmentStatus === 'HANDCRAFTING'
                            ? 'var(--pr)'
                            : o.fulfilmentStatus === 'DELIVERED'
                            ? 'var(--ok)'
                            : 'var(--wn)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {o.fulfilmentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <select
                      className="input"
                      style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                      value={o.fulfilmentStatus}
                      onChange={(e) =>
                        handleStatusChange(o.id, e.target.value as Order['fulfilmentStatus'])
                      }
                    >
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="HANDCRAFTING">HANDCRAFTING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workshop Alerts & Quick Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Kanyakumari Artisan Task Board */}
        <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', marginBottom: '14px' }}>
            Kanyakumari Artisan Workshop Queue
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: 'var(--bg2)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, color: 'var(--pr)' }}>
                Kundan Bridal Set (AVL-9842)
              </div>
              <div style={{ color: 'var(--tx2)', marginTop: '2px' }}>
                Bride: Priya • Custom text: &ldquo;Priya & Karthik&rdquo; • Due in 3 days
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg2)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, color: 'var(--pr)' }}>
                Name Bangle Duo (AVL-9843)
              </div>
              <div style={{ color: 'var(--tx2)', marginTop: '2px' }}>
                Bride: Ananya • Custom text: &ldquo;Ananya weds Vikram&rdquo; • Silk shade: Crimson
              </div>
            </div>
          </div>
        </div>

        {/* Inventory low stock alert */}
        <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', marginBottom: '14px' }}>
            Inventory Stock Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0E8E6' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Antique Bangle Pair (Size 2.6)</div>
                <div style={{ color: 'var(--tx2)', fontSize: '11px' }}>Category: Bridal Bangles</div>
              </div>
              <span style={{ color: 'var(--wn)', background: '#fbe8c8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>
                9 left in stock
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Bridal Maang Tikka</div>
                <div style={{ color: 'var(--tx2)', fontSize: '11px' }}>Category: Hair Accessories</div>
              </div>
              <span style={{ color: 'var(--wn)', background: '#fbe8c8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>
                12 left in stock
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
