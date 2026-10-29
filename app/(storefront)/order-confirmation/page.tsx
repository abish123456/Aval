'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams?.get('orderNumber') || 'AVL-9842'

  const [order] = useState<{
    orderNumber: string
    createdAt: string
    customer: {
      fullName: string
      email: string
      phone: string
      street: string
      city: string
      state: string
      pincode: string
      notes?: string
    }
    items: Array<{
      id: string
      product: { name: string; images: string[] }
      size: string
      customName?: string
      weddingDate?: string
      quantity: number
      price: number
    }>
    subtotal: number
    discount: number
    shipping: number
    total: number
    paymentMethod: string
    paymentStatus: string
  }>(() => {
    const defaultOrder = {
      orderNumber,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      customer: {
        fullName: 'Priya Sundaram',
        email: 'priya.sundaram@gmail.com',
        phone: '9840212345',
        street: '14, Beach Road, Near Cape Point',
        city: 'Kanyakumari',
        state: 'Tamil Nadu',
        pincode: '629702',
        notes: 'Bridal Muhurtham order',
      },
      items: [
        {
          id: 'item-1',
          product: {
            name: 'Kundan Royal Bridal Bangle Set',
            images: [
              '/images/kundan_set.jpg',
            ],
          },
          size: '2.6',
          customName: 'Priya & Karthik',
          weddingDate: '18 Nov 2026',
          quantity: 1,
          price: 2099,
        },
        {
          id: 'item-2',
          product: {
            name: 'Freshwater Pearl Bridal Hair Clip',
            images: [
              '/images/pearl_hair_clip.jpg',
            ],
          },
          size: 'Standard (12cm)',
          quantity: 1,
          price: 699,
        },
      ],
      subtotal: 2798,
      discount: 300,
      shipping: 0,
      total: 2498,
      paymentMethod: 'Razorpay UPI',
      paymentStatus: 'PAID',
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('last_order')
        if (stored) {
          return JSON.parse(stored)
        }
      } catch {
        // ignore
      }
    }

    return defaultOrder
  })

  return (
    <div className="container" style={{ paddingTop: '50px', paddingBottom: '90px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Header Hero Banner */}
        <div
          className="card"
          style={{
            padding: '40px 32px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #FDF9F7 0%, #FAF0EC 100%)',
            border: '1px solid var(--bd)',
            borderRadius: '12px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#dcefe1',
              color: 'var(--ok)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-script, "Pinyon Script", cursive)',
              fontSize: '36px',
              color: 'var(--pr)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Thank you, {order.customer.fullName}!
          </span>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', marginBottom: '8px' }}>
            Your Bridal Order is Confirmed
          </h1>

          <p style={{ color: 'var(--tx2)', fontSize: '14px', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            We have received your custom order. Our Kanyakumari artisans will begin preparing and hand-lettering your bridal accessories.
          </p>

          <div
            style={{
              display: 'inline-flex',
              gap: '24px',
              background: '#fff',
              padding: '12px 24px',
              borderRadius: '30px',
              border: '1px solid var(--bd)',
              fontSize: '13px',
              color: 'var(--dk)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div>
              <span style={{ color: 'var(--tx2)' }}>Order Reference: </span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div style={{ borderLeft: '1px solid var(--bd)', paddingLeft: '24px' }}>
              <span style={{ color: 'var(--tx2)' }}>Payment Status: </span>
              <span style={{ color: 'var(--ok)', fontWeight: 600 }}>● {order.paymentStatus}</span>
            </div>
            <div style={{ borderLeft: '1px solid var(--bd)', paddingLeft: '24px' }}>
              <span style={{ color: 'var(--tx2)' }}>Delivery Est: </span>
              <strong>4 - 6 Business Days</strong>
            </div>
          </div>
        </div>

        {/* Handcraft Fulfillment Timeline */}
        <div className="card" style={{ padding: '28px', background: '#fff', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', marginBottom: '24px' }}>
            Handcraft & Dispatch Timeline
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', textAlign: 'center' }}>
            {[
              { label: 'Order Received', desc: 'Confirmed & Logged', active: true, done: true },
              { label: 'Kanyakumari Artisans', desc: 'Silk thread wrapping', active: true, done: true },
              { label: 'Custom Lettering', desc: 'Personalised names', active: true, done: false },
              { label: 'Quality Check', desc: 'Stone setting & shine', active: false, done: false },
              { label: 'Dispatched', desc: 'Insured courier', active: false, done: false },
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: step.done ? 'var(--pr)' : step.active ? 'var(--bl2)' : 'var(--bg2)',
                    color: step.done ? '#fff' : step.active ? 'var(--pr)' : 'var(--tx2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    border: step.active ? '2px solid var(--pr)' : 'none',
                  }}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)' }}>{step.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '2px' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="card" style={{ padding: '28px', background: '#fff', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', marginBottom: '18px' }}>
            Order Items
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--bd)' }}>
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--dk)', fontSize: '14px' }}>{item.product.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>
                    Size: {item.size} • Qty: {item.quantity}
                  </div>
                  {item.customName && (
                    <div style={{ fontSize: '12px', color: 'var(--pr)', fontWeight: 500, marginTop: '2px' }}>
                      ✍️ Custom Names: &ldquo;{item.customName}&rdquo; {item.weddingDate && `(${item.weddingDate})`}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--pr)', fontSize: '15px' }}>
                  {fmt(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', fontSize: '13px' }}>
            <div>
              <h4 style={{ fontWeight: 600, color: 'var(--dk)', marginBottom: '6px' }}>Delivery Address</h4>
              <p style={{ color: 'var(--tx2)', lineHeight: 1.6 }}>
                {order.customer.fullName}<br />
                {order.customer.street}<br />
                {order.customer.city}, {order.customer.state} - {order.customer.pincode}<br />
                Phone: +91 {order.customer.phone}
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, color: 'var(--dk)', marginBottom: '6px' }}>Payment Info</h4>
              <p style={{ color: 'var(--tx2)', lineHeight: 1.6 }}>
                Method: <strong>{order.paymentMethod}</strong><br />
                Status: <span style={{ color: 'var(--ok)', fontWeight: 600 }}>{order.paymentStatus}</span><br />
                Confirmation sent to: <strong>{order.customer.email}</strong>
              </p>
            </div>

            <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--tx2)' }}>Subtotal:</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ok)', marginBottom: '6px' }}>
                  <span>Discount:</span>
                  <span>− {fmt(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--tx2)' }}>Shipping:</span>
                <span>{order.shipping === 0 ? 'FREE' : fmt(order.shipping)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--bd)', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--pr)', fontSize: '15px' }}>
                <span>Total Paid:</span>
                <span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Receipt
          </button>

          <Link href="/track-order" className="btn btn-primary" style={{ padding: '12px 28px' }}>
            Track Live Status
          </Link>

          <Link href="/shop" className="btn btn-outline" style={{ padding: '12px 24px' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading confirmed order...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  )
}
