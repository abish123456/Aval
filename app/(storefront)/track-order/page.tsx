'use client'

import Link from 'next/link'
import { useState } from 'react'
import { INITIAL_ORDERS, Order } from '@/lib/data'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function TrackOrderPage() {
  const [query, setQuery] = useState('AVL-9842')
  const [foundOrder, setFoundOrder] = useState<Order | null>(INITIAL_ORDERS[0])
  const [searched, setSearched] = useState(true)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
    const q = query.trim().toUpperCase()
    const match = INITIAL_ORDERS.find(
      (o) =>
        o.orderNumber.toUpperCase() === q ||
        o.phone.includes(q) ||
        o.email.toLowerCase() === query.trim().toLowerCase()
    )
    setFoundOrder(match || null)
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Track Order</span>
      </nav>

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--dk)', marginBottom: '8px' }}>
            Track Your Bridal Delivery
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '14px' }}>
            Enter your AVAL order number (e.g. <code>AVL-9842</code>) or mobile number to see live status.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '36px' }}>
          <input
            type="text"
            className="input"
            placeholder="Order number (AVL-9842) or mobile..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontSize: '15px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 28px', whiteSpace: 'nowrap' }}>
            Track Order
          </button>
        </form>

        {searched && foundOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Status card */}
            <div className="card" style={{ padding: '28px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>Order Number</span>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--pr)' }}>
                    {foundOrder.orderNumber}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>Fulfilment Status</span>
                  <div>
                    <span
                      style={{
                        background: '#dcefe1',
                        color: 'var(--ok)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-block',
                      }}
                    >
                      ● {foundOrder.fulfilmentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ position: 'relative', marginBottom: '30px' }}>
                <div style={{ height: '4px', background: 'var(--bg2)', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ width: '45%', height: '100%', background: 'var(--pr)', borderRadius: '2px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--pr)', fontWeight: 600 }}>✓ Placed</div>
                  <div style={{ color: 'var(--pr)', fontWeight: 600 }}>● Handcrafting in Kanyakumari</div>
                  <div style={{ color: 'var(--tx2)' }}>○ Dispatched</div>
                  <div style={{ color: 'var(--tx2)' }}>○ Out for Delivery</div>
                </div>
              </div>

              {foundOrder.carrier && (
                <div style={{ background: 'var(--bg2)', padding: '14px 18px', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    Courier Partner: <strong>{foundOrder.carrier}</strong>
                  </div>
                  <div>
                    Air Waybill (AWB): <strong>{foundOrder.trackingNumber}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Item list */}
            <div className="card" style={{ padding: '24px', background: '#fff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--dk)', marginBottom: '16px' }}>
                Items in This Shipment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {foundOrder.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img
                      src={it.product.images[0]}
                      alt={it.product.name}
                      style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--dk)' }}>{it.product.name}</div>
                      <div style={{ color: 'var(--tx2)' }}>Size: {it.size} • Qty: {it.qty}</div>
                      {it.customName && (
                        <div style={{ color: 'var(--pr)', fontSize: '12px', fontWeight: 500 }}>
                          ✍️ &ldquo;{it.customName}&rdquo; {it.weddingDate && `(${it.weddingDate})`}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--pr)' }}>
                      {fmt(it.price * it.qty)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="card" style={{ padding: '24px', background: '#fff', fontSize: '13px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--dk)', marginBottom: '12px' }}>
                Shipping Destination
              </h3>
              <p style={{ color: 'var(--tx2)', lineHeight: 1.6 }}>
                <strong>{foundOrder.customerName}</strong><br />
                {foundOrder.shippingAddress.street}<br />
                {foundOrder.shippingAddress.city}, {foundOrder.shippingAddress.state} - {foundOrder.shippingAddress.pincode}<br />
                Phone: {foundOrder.phone}
              </p>
            </div>
          </div>
        )}

        {searched && !foundOrder && (
          <div className="card" style={{ padding: '36px', textAlign: 'center', background: '#fff' }}>
            <p style={{ color: 'var(--pr)', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
              No order found matching &ldquo;{query}&rdquo;
            </p>
            <p style={{ color: 'var(--tx2)', fontSize: '13px', marginBottom: '20px' }}>
              Please check your confirmation email or SMS, or contact our Kanyakumari help desk on WhatsApp.
            </p>
            <a
              href="https://wa.me/919840212345"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Contact Support on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
