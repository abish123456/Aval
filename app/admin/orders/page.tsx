'use client'

import { useState, useEffect } from 'react'
import { INITIAL_ORDERS, Order } from '@/lib/data'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

interface ApiOrderItem {
  id: string
  qty: number
  unitPricePaise: number
  lineTotalPaise: number
  size?: string
  customisation?: string
  snapshotJson: { name?: string; image?: string }
}

interface ApiOrder {
  id: string
  orderNumber: string
  createdAt: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  fulfilmentStatus: Order['fulfilmentStatus']
  paymentStatus: Order['paymentStatus']
  subtotalPaise: number
  discountPaise: number
  shippingPaise: number
  totalPaise: number
  items: ApiOrderItem[]
  user?: { name: string; email: string }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROCESSING' | 'HANDCRAFTING' | 'SHIPPED' | 'DELIVERED'>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const loaded: Order[] = res.data.data.map((o: ApiOrder) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            createdAt: o.createdAt,
            customerName: o.guestName || o.user?.name || 'Customer',
            email: o.guestEmail || o.user?.email || '',
            phone: o.guestPhone || '',
            shippingAddress: {
              street: 'Studio Hub Delivery',
              city: 'Kanyakumari',
              state: 'Tamil Nadu',
              pincode: '629702',
            },
            items: (o.items || []).map((it: ApiOrderItem) => ({
              id: it.id,
              product: {
                id: it.id,
                name: it.snapshotJson?.name || 'Bridal Item',
                slug: 'bridal-item',
                category: 'Bridal Bangles',
                categorySlug: 'bridal-bangles',
                regularPrice: it.unitPricePaise / 100,
                salePrice: it.unitPricePaise / 100,
                discountPercent: 0,
                rating: 5,
                reviewCount: 0,
                customisable: Boolean(it.customisation),
                stock: 10,
                description: '',
                details: [],
                images: [it.snapshotJson?.image || '/images/hero_bangles.jpg'],
                sizes: [it.size || '2.6'],
              },
              size: it.size || '2.6',
              customName: it.customisation,
              qty: it.qty,
              price: it.lineTotalPaise / 100,
            })),
            subtotal: o.subtotalPaise / 100,
            discount: o.discountPaise / 100,
            shipping: o.shippingPaise / 100,
            total: o.totalPaise / 100,
            paymentMethod: 'Razorpay UPI',
            paymentStatus: o.paymentStatus || 'PENDING',
            fulfilmentStatus: o.fulfilmentStatus || 'CONFIRMED',
          }))
          setOrders(loaded)
        }
      })
      .catch(() => {})
  }, [])

  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'ALL' || o.fulfilmentStatus === activeTab
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search)
    return matchesTab && matchesSearch
  })

  const updateStatus = (id: string, st: Order['fulfilmentStatus']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, fulfilmentStatus: st } : o)))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--dk)', margin: 0 }}>
            Orders Management
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
            Track, update fulfilment stages, and view custom bridal embroidery notes
          </p>
        </div>

        <input
          type="text"
          className="input"
          placeholder="Search order ref, customer, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '280px' }}
        />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--bd)', paddingBottom: '12px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {(['ALL', 'PROCESSING', 'HANDCRAFTING', 'SHIPPED', 'DELIVERED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === tab ? 'var(--pr)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--tx)',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredOrders.map((o) => (
          <div key={o.id} className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #F0E8E6', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--pr)' }}>
                    {o.orderNumber}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                    • Placed {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--dk)', marginTop: '4px' }}>
                  {o.customerName} • {o.phone} • {o.email}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>
                  Shipping to: {o.shippingAddress.street}, {o.shippingAddress.city}, {o.shippingAddress.state} - {o.shippingAddress.pincode}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    background: '#dcefe1',
                    color: 'var(--ok)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {o.paymentStatus} ({o.paymentMethod})
                </span>

                <select
                  className="input"
                  style={{ padding: '6px 10px', fontSize: '13px', fontWeight: 600, color: 'var(--pr)', background: 'var(--bl2)' }}
                  value={o.fulfilmentStatus}
                  onChange={(e) => updateStatus(o.id, e.target.value as Order['fulfilmentStatus'])}
                >
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="HANDCRAFTING">HANDCRAFTING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>
            </div>

            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {o.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={it.product.images[0]}
                      alt={it.product.name}
                      style={{ width: '44px', height: '44px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--dk)' }}>{it.product.name}</div>
                      <div style={{ color: 'var(--tx2)', fontSize: '12px' }}>
                        Size: {it.size} • Qty: {it.qty}
                      </div>
                      {it.customName && (
                        <div style={{ color: 'var(--pr)', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                          ✍️ &ldquo;{it.customName}&rdquo; {it.weddingDate && `• ${it.weddingDate}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--dk)' }}>
                    {fmt(it.price * it.qty)}
                  </div>
                </div>
              ))}
            </div>

            {/* Order total & notes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0E8E6', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                {o.notes && <div><strong>Customer Note:</strong> {o.notes}</div>}
                {o.carrier && <div><strong>Carrier:</strong> {o.carrier} ({o.trackingNumber})</div>}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--pr)' }}>
                Order Total: {fmt(o.total)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
