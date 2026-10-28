'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { PRODUCTS, Product } from '@/lib/data'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

interface SavedAddress {
  id: string
  label: string
  fullName: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

interface CustomQuote {
  id: string
  reference: string
  title: string
  category: string
  requestDate: string
  expiryDate: string
  status: 'QUOTE_READY' | 'ACCEPTED' | 'IN_PRODUCTION' | 'DECLINED'
  estimatedDays: number
  price: number
  breakdown: { label: string; amount: number }[]
  artisanNote: string
  specifications: {
    size: string
    color: string
    customText: string
    eventDate: string
  }
}

interface CustomerProfile {
  fullName: string
  email: string
  phone: string
  weddingDate: string
  groomName: string
  bangleSize: string
}

const INITIAL_PROFILE: CustomerProfile = {
  fullName: 'Priya Sundaram',
  email: 'priya.sundaram@gmail.com',
  phone: '+91 98402 12345',
  weddingDate: '2026-11-18',
  groomName: 'Karthik',
  bangleSize: '2.6',
}

const INITIAL_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    label: 'Bridal Muhurtham Destination (Default)',
    fullName: 'Priya Sundaram',
    phone: '+91 98402 12345',
    street: '14, Beach Road, Near Cape Point',
    city: 'Kanyakumari',
    state: 'Tamil Nadu',
    pincode: '629702',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Family Home',
    fullName: 'Priya Sundaram',
    phone: '+91 98402 12345',
    street: '28/A, West Car Street',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625001',
    isDefault: false,
  },
]

const INITIAL_QUOTES: CustomQuote[] = [
  {
    id: 'quote-101',
    reference: 'CUST-7821',
    title: 'Heritage Temple Kundan & Crimson Silk Thread Kada Set',
    category: 'Customised Bangles',
    requestDate: '24 Oct 2026',
    expiryDate: '05 Nov 2026',
    status: 'QUOTE_READY',
    estimatedDays: 6,
    price: 3100,
    breakdown: [
      { label: 'Base silk thread kada handcrafted core (Pair)', amount: 2400 },
      { label: '22k micro gold-foil bride & groom name lettering', amount: 400 },
      { label: 'Hand-set Ruby Kundan stones & jhumka mini danglers', amount: 300 },
      { label: 'Signature AVAL trousseau velvet trunk', amount: 0 },
    ],
    artisanNote:
      'We have sourced matching deep crimson silk thread to complement your Kanjivaram saree border. Our master artisan can begin hand-setting the stones as soon as you confirm.',
    specifications: {
      size: '2.6 (Medium)',
      color: 'Crimson Red & Antique Gold',
      customText: 'Priya & Karthik • 18-11-2026',
      eventDate: '18 Nov 2026',
    },
  },
  {
    id: 'quote-102',
    reference: 'CUST-7640',
    title: 'Poola Jada Bridal Hair Extension & Jadabi Floral Clips',
    category: 'Bridal Hair Accessories',
    requestDate: '19 Oct 2026',
    expiryDate: '30 Oct 2026',
    status: 'IN_PRODUCTION',
    estimatedDays: 5,
    price: 1850,
    breakdown: [
      { label: 'Jadabi floral hair barrettes (Set of 9)', amount: 1550 },
      { label: 'Custom pearl tassel drop finish', amount: 300 },
    ],
    artisanNote: 'Handcrafting currently underway by our artisan in Kanyakumari. Estimated dispatch within 2 business days.',
    specifications: {
      size: 'Standard 45cm plait length',
      color: 'Fresh Jasmine Cream & Golden Zari',
      customText: 'Custom floral pattern with freshwater mini pearls',
      eventDate: '18 Nov 2026',
    },
  },
]

export default function AccountPage() {
  const { addItem } = useCart()

  // Authentication simulation
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [authEmail, setAuthEmail] = useState('priya.sundaram@gmail.com')
  const [authPassword, setAuthPassword] = useState('••••••••')

  // Active Tab: orders | quotes | profile | addresses | wishlist
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'profile' | 'addresses' | 'wishlist'>('orders')

  // Profile state
  const [profile, setProfile] = useState<CustomerProfile>(INITIAL_PROFILE)
  const [profileSaved, setProfileSaved] = useState(false)

  // Addresses state
  const [addresses, setAddresses] = useState<SavedAddress[]>(INITIAL_ADDRESSES)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState<Omit<SavedAddress, 'id' | 'isDefault'>>({
    label: '',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
  })

  // Quotes state
  const [quotes, setQuotes] = useState<CustomQuote[]>(INITIAL_QUOTES)
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null)

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState<Product[]>([PRODUCTS[0], PRODUCTS[1], PRODUCTS[4]])

  // Orders list (combining default sample order and any session checkout order)
  const [orders] = useState<Array<{
    orderNumber: string
    createdAt: string
    paymentMethod: string
    paymentStatus: string
    fulfilmentStatus: string
    total: number
    items: Array<{
      name: string
      size?: string
      customName?: string
      weddingDate?: string
      quantity: number
      price: number
      image: string
    }>
    trackingNumber?: string
    carrier?: string
  }>>(() => {
    const baseOrders = [
      {
        orderNumber: 'AVL-9842',
        createdAt: '27 Oct 2026',
        paymentMethod: 'Razorpay UPI',
        paymentStatus: 'PAID',
        fulfilmentStatus: 'HANDCRAFTING',
        total: 3197,
        items: [
          {
            name: 'Kundan Royal Bridal Bangle Set',
            size: '2.6',
            customName: 'Priya & Karthik',
            weddingDate: '18 Nov 2026',
            quantity: 1,
            price: 2099,
            image: '/images/hero_bangles.jpg',
          },
          {
            name: 'Pearl Hair Clip',
            size: 'Standard (12cm)',
            quantity: 2,
            price: 699,
            image: '/images/pearl_hair_clip.jpg',
          },
        ],
        trackingNumber: 'DEL-92841029',
        carrier: 'Delhivery Express',
      },
      {
        orderNumber: 'AVL-8910',
        createdAt: '12 Sep 2026',
        paymentMethod: 'Credit Card',
        paymentStatus: 'PAID',
        fulfilmentStatus: 'DELIVERED',
        total: 1499,
        items: [
          {
            name: 'Traditional Temple Gold Bangles',
            size: '2.6',
            quantity: 1,
            price: 1499,
            image: '/images/antique_bangles.jpg',
          },
        ],
        trackingNumber: 'BLU-4412091',
        carrier: 'Blue Dart Express',
      },
    ]

    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('last_order')
        if (stored) {
          const parsed = JSON.parse(stored)
          return [
            {
              orderNumber: parsed.orderNumber,
              createdAt: 'Just now',
              paymentMethod: parsed.paymentMethod || 'Razorpay UPI',
              paymentStatus: parsed.paymentStatus || 'PAID',
              fulfilmentStatus: 'CONFIRMED',
              total: parsed.total,
              items: (parsed.items || []).map((it: { product?: { name?: string; images?: string[] }; name?: string; size?: string; customName?: string; weddingDate?: string; quantity?: number; price?: number }) => ({
                name: it.product?.name || it.name || 'Bridal Item',
                size: it.size,
                customName: it.customName,
                weddingDate: it.weddingDate,
                quantity: it.quantity || 1,
                price: it.price || 0,
                image: it.product?.images?.[0] || '/images/hero_bangles.jpg',
              })),
              trackingNumber: 'Generating AWB...',
              carrier: 'Delhivery Express',
            },
            ...baseOrders,
          ]
        }
      } catch {
        // ignore
      }
    }

    return baseOrders
  })

  // Calculate days until wedding
  const weddingDaysRemaining = Math.max(
    0,
    Math.ceil((new Date(profile.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  )

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAddress.fullName || !newAddress.street || !newAddress.pincode) return
    const created: SavedAddress = {
      ...newAddress,
      id: 'addr-' + Date.now(),
      isDefault: addresses.length === 0,
    }
    setAddresses([...addresses, created])
    setNewAddress({
      label: '',
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
    })
    setShowAddAddress(false)
  }

  const setDefaultAddress = (id: string) => {
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })))
  }

  const deleteAddress = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id))
  }

  const handleAcceptQuote = (quote: CustomQuote) => {
    // Add custom quote product to cart
    const customProduct: Product = {
      id: 'quote-prod-' + quote.id,
      name: quote.title,
      slug: 'custom-quote-' + quote.reference.toLowerCase(),
      category: quote.category,
      categorySlug: 'customised',
      regularPrice: quote.price + 500,
      salePrice: quote.price,
      discountPercent: 14,
      rating: 5.0,
      reviewCount: 1,
      customisable: true,
      stock: 1,
      description: quote.artisanNote,
      details: quote.breakdown.map((b) => `${b.label}: ₹${b.amount}`),
      images: ['/images/name_bangles.jpg'],
      sizes: [quote.specifications.size],
    }

    addItem(
      customProduct,
      quote.specifications.size,
      quote.specifications.customText,
      quote.specifications.eventDate,
      1
    )

    setQuotes(quotes.map((q) => (q.id === quote.id ? { ...q, status: 'ACCEPTED' } : q)))
    setQuoteSuccessMsg(`Quote ${quote.reference} accepted and added to your bag!`)
    setTimeout(() => setQuoteSuccessMsg(null), 4000)
  }

  const handleDeclineQuote = (id: string) => {
    setQuotes(quotes.map((q) => (q.id === id ? { ...q, status: 'DECLINED' } : q)))
  }

  const removeWishlist = (id: string) => {
    setWishlistItems(wishlistItems.filter((item) => item.id !== id))
  }

  // ── Guest / Login View ──────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '100px', maxWidth: '520px' }}>
        <div className="card" style={{ padding: '36px', background: '#fff', textAlign: 'center', border: '1px solid var(--bd)' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: '36px', color: 'var(--pr)', marginBottom: '4px' }}>
            Welcome to AVAL
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', marginBottom: '8px' }}>
            Sign In to Your Bridal Account
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '14px', marginBottom: '28px' }}>
            Track handcrafted bridal orders, review bespoke design quotes, and manage your wedding delivery details.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setIsAuthenticated(true)
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}
          >
            <label className="input-label">
              <span>Email Address or Mobile Number</span>
              <input
                type="text"
                className="input"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="priya@example.com"
              />
            </label>

            <label className="input-label">
              <span>Password</span>
              <input
                type="password"
                className="input"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter password"
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a href="#" style={{ color: 'var(--pr)', textDecoration: 'none' }}>Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Sign In to Bridal Account
            </button>

            <div style={{ borderTop: '1px solid var(--bd)', margin: '14px 0 10px', position: 'relative', textAlign: 'center' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', fontSize: '12px', color: 'var(--tx2)' }}>
                Demo Quick Access
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthEmail('priya.sundaram@gmail.com')
                setIsAuthenticated(true)
              }}
              className="btn btn-outline"
              style={{ width: '100%', fontSize: '13px' }}
            >
              🌸 Instant Demo Sign In as Bride Priya
            </button>
          </form>

          <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--tx2)' }}>
            Need to track an order without logging in?{' '}
            <Link href="/track-order" style={{ color: 'var(--pr)', fontWeight: 600 }}>
              Track Guest Order →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Authenticated Account View ──────────────────────────────────
  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '90px' }}>
      {/* Toast Notification */}
      {quoteSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--dk)',
            color: '#fff',
            padding: '14px 20px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            borderLeft: '4px solid var(--ok)',
          }}
        >
          <span>✓</span>
          <span>{quoteSuccessMsg}</span>
          <Link href="/cart" className="btn btn-sm btn-primary" style={{ marginLeft: '12px' }}>
            View Bag →
          </Link>
        </div>
      )}

      {/* Profile Header Card */}
      <div
        className="card account-header-card"
        style={{
          background: 'linear-gradient(135deg, #FFF 0%, #FAF2F0 100%)',
          border: '1px solid var(--bd)',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--pr)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-serif)',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            {profile.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', margin: 0 }}>
                {profile.fullName}
              </h1>
              <span className="tag tag-blush">AVAL Bride</span>
            </div>
            <p style={{ color: 'var(--tx2)', fontSize: '13px', margin: '4px 0 0' }}>
              {profile.email} • {profile.phone}
            </p>
          </div>
        </div>

        {/* Wedding Muhurtham Countdown Badge */}
        <div className="account-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#fff',
              border: '1px solid var(--bd)',
              borderRadius: 0,
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tx2)' }}>
              Wedding Muhurtham
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 700, color: 'var(--pr)' }}>
              {new Date(profile.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ok)', fontWeight: 600 }}>
              🌸 {weddingDaysRemaining} days to go
            </div>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Account Grid: Sidebar Tabs + Content */}
      <div className="account-grid">
        {/* Account Nav Tabs */}
        <aside className="card account-tabs-nav" style={{ border: '1px solid var(--bd)' }}>
          {[
            { id: 'orders', label: 'Order History', icon: '📦', count: orders.length },
            { id: 'quotes', label: 'Bespoke Quotes', icon: '💎', badge: quotes.filter((q) => q.status === 'QUOTE_READY').length },
            { id: 'profile', label: 'Bridal Profile', icon: '🌸' },
            { id: 'addresses', label: 'Saved Addresses', icon: '📍', count: addresses.length },
            { id: 'wishlist', label: 'Bridal Wishlist', icon: '❤️', count: wishlistItems.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: isActive ? 'var(--pr)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--dk)',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.badge ? (
                  <span
                    style={{
                      background: isActive ? '#fff' : 'var(--pr)',
                      color: isActive ? 'var(--pr)' : '#fff',
                      fontSize: '10px',
                      padding: '2px 7px',
                      fontWeight: 700,
                      borderRadius: '10px',
                    }}
                  >
                    {tab.badge} New
                  </span>
                ) : typeof tab.count === 'number' ? (
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>({tab.count})</span>
                ) : null}
              </button>
            )
          })}

          <hr style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: '8px 0' }} />

          <Link
            href="/custom-order"
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: 'var(--pr)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <span>✨</span>
            <span>Request Custom Piece</span>
          </Link>
        </aside>

        {/* Tab Content Container */}
        <main style={{ minWidth: 0 }}>
          {/* ── TAB 1: ORDERS ────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', margin: 0 }}>
                    Bridal Orders History
                  </h2>
                  <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '2px' }}>
                    Track fulfillment, view bespoke handcrafting details, and access order invoices.
                  </p>
                </div>
                <Link href="/shop" className="btn btn-sm btn-outline">
                  Browse Store
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛍️</div>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No orders placed yet</h3>
                  <p style={{ color: 'var(--tx2)', fontSize: '14px', marginBottom: '20px' }}>
                    Explore our handcrafted bridal bangles and wedding hair accessories.
                  </p>
                  <Link href="/shop" className="btn btn-primary">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.orderNumber} className="card" style={{ padding: '24px', background: '#fff' }}>
                    {/* Order Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        paddingBottom: '16px',
                        borderBottom: '1px solid var(--bd)',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--pr)' }}>
                            {ord.orderNumber}
                          </span>
                          <span className={`tag ${ord.fulfilmentStatus === 'DELIVERED' ? 'tag-ok' : 'tag-warning'}`}>
                            {ord.fulfilmentStatus}
                          </span>
                          <span className="tag tag-ok">{ord.paymentStatus}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '4px' }}>
                          Placed on {ord.createdAt} • Paid via {ord.paymentMethod}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>Total Amount</div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--dk)' }}>
                          {fmt(ord.total)}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {ord.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: '64px',
                              height: '64px',
                              objectFit: 'cover',
                              border: '1px solid var(--bd)',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--dk)' }}>{item.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--tx2)', marginTop: '2px' }}>
                              {item.size && <span>Size: {item.size} • </span>}
                              <span>Qty: {item.quantity}</span>
                            </div>
                            {item.customName && (
                              <div style={{ fontSize: '12px', color: 'var(--pr)', marginTop: '2px', fontWeight: 500 }}>
                                ✍️ Bride &amp; Groom: &ldquo;{item.customName}&rdquo; {item.weddingDate && `(${item.weddingDate})`}
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '15px' }}>{fmt(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer & Actions */}
                    <div
                      style={{
                        borderTop: '1px solid var(--bd)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        background: '#FAF6F4',
                        margin: '12px 0 0',
                        padding: '14px 16px',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ fontSize: '13px', color: 'var(--tx2)' }}>
                        {ord.carrier && ord.trackingNumber && (
                          <span>
                            Courier: <strong>{ord.carrier}</strong> (AWB: {ord.trackingNumber})
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Link
                          href={`/track-order?ref=${ord.orderNumber}`}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '12px' }}
                        >
                          Track Package
                        </Link>
                        <button
                          onClick={() => window.print()}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '12px' }}
                        >
                          Print Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB 2: BESPOKE QUOTES ───────────────────────────── */}
          {activeTab === 'quotes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', margin: 0 }}>
                    Bespoke Bridal Quotes
                  </h2>
                  <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '2px' }}>
                    Personalised pricing prepared by our Kanyakumari artisans for your custom designs.
                  </p>
                </div>
                <Link href="/custom-order" className="btn btn-sm btn-primary">
                  + New Custom Request
                </Link>
              </div>

              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="card"
                  style={{
                    padding: '24px',
                    background: '#fff',
                    border: q.status === 'QUOTE_READY' ? '1.5px solid var(--pr)' : '1px solid var(--bd)',
                    position: 'relative',
                  }}
                >
                  {/* Status Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--pr)' }}>
                          {q.reference}
                        </span>
                        {q.status === 'QUOTE_READY' && <span className="tag tag-primary">Quote Ready — Action Required</span>}
                        {q.status === 'ACCEPTED' && <span className="tag tag-ok">Accepted &amp; Added to Bag</span>}
                        {q.status === 'IN_PRODUCTION' && <span className="tag tag-warning">In Workshop Handcrafting</span>}
                        {q.status === 'DECLINED' && <span className="tag tag-error">Declined</span>}
                      </div>
                      <h3 style={{ fontSize: '18px', color: 'var(--dk)', marginTop: '4px' }}>{q.title}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>
                        Requested on {q.requestDate} • Valid until {q.expiryDate}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>Quoted Price</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--pr)' }}>
                        {fmt(q.price)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ok)' }}>Includes velvet bridal trunk</div>
                    </div>
                  </div>

                  {/* Specifications & Artisan Note */}
                  <div
                    style={{
                      background: '#FAF6F4',
                      padding: '16px',
                      border: '1px solid var(--bd)',
                      marginBottom: '16px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--dk)', marginBottom: '6px' }}>
                      Artisan Note from Workshop:
                    </div>
                    <p style={{ color: 'var(--tx)', fontStyle: 'italic', marginBottom: '12px', lineHeight: 1.5 }}>
                      &ldquo;{q.artisanNote}&rdquo;
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px dashed var(--bd)' }}>
                      <div><strong>Size:</strong> {q.specifications.size}</div>
                      <div><strong>Palette:</strong> {q.specifications.color}</div>
                      <div><strong>Custom Text:</strong> {q.specifications.customText}</div>
                      <div><strong>Muhurtham:</strong> {q.specifications.eventDate}</div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tx2)', marginBottom: '8px' }}>
                      Itemized Quote Breakdown
                    </div>
                    {q.breakdown.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          padding: '6px 0',
                          borderBottom: '1px solid #F2EAE7',
                        }}
                      >
                        <span>{item.label}</span>
                        <span>{item.amount === 0 ? 'Complimentary' : fmt(item.amount)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, paddingTop: '10px' }}>
                      <span>Estimated Production Timeline</span>
                      <span>{q.estimatedDays} Working Days</span>
                    </div>
                  </div>

                  {/* Quote Actions */}
                  {q.status === 'QUOTE_READY' && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAcceptQuote(q)}
                        className="btn btn-primary"
                        style={{ flex: 1, minWidth: '180px' }}
                      >
                        Accept Quote &amp; Proceed to Bag →
                      </button>
                      <a
                        href={`https://wa.me/919876543210?text=Hi%20AVAL%20Team%2C%20regarding%20my%20quote%20${q.reference}%20for%20${encodeURIComponent(q.title)}...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        Chat with Designer
                      </a>
                      <button
                        onClick={() => handleDeclineQuote(q.id)}
                        className="btn btn-ghost"
                        style={{ color: 'var(--tx2)' }}
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {q.status === 'ACCEPTED' && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Link href="/cart" className="btn btn-primary btn-sm">
                        View Item in Bag &amp; Checkout →
                      </Link>
                      <span style={{ fontSize: '13px', color: 'var(--ok)' }}>
                        ✓ Added to current bag session
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── TAB 3: BRIDAL PROFILE ──────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="card" style={{ padding: '28px', background: '#fff' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', margin: 0 }}>
                  Bridal &amp; Personal Profile
                </h2>
                <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '2px' }}>
                  Keep your wedding dates and sizing prefilled for seamless bespoke ordering.
                </p>
              </div>

              {profileSaved && (
                <div style={{ background: 'var(--ok-bg)', color: 'var(--ok)', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', borderLeft: '4px solid var(--ok)' }}>
                  ✓ Profile preferences saved successfully!
                </div>
              )}

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <label className="input-label">
                    <span>Full Name</span>
                    <input
                      type="text"
                      className="input"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      required
                    />
                  </label>

                  <label className="input-label">
                    <span>Email Address</span>
                    <input
                      type="email"
                      className="input"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <label className="input-label">
                    <span>Mobile Phone</span>
                    <input
                      type="text"
                      className="input"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      required
                    />
                  </label>

                  <label className="input-label">
                    <span>Wedding / Muhurtham Date</span>
                    <input
                      type="date"
                      className="input"
                      value={profile.weddingDate}
                      onChange={(e) => setProfile({ ...profile, weddingDate: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <label className="input-label">
                    <span>Groom&apos;s Name (for couple bangles)</span>
                    <input
                      type="text"
                      className="input"
                      value={profile.groomName}
                      onChange={(e) => setProfile({ ...profile, groomName: e.target.value })}
                      placeholder="e.g. Karthik"
                    />
                  </label>

                  <label className="input-label">
                    <span>Default Bangle Size</span>
                    <select
                      className="input"
                      value={profile.bangleSize}
                      onChange={(e) => setProfile({ ...profile, bangleSize: e.target.value })}
                    >
                      <option value="2.4">2.4 (Small - 57.2mm)</option>
                      <option value="2.6">2.6 (Medium - 60.3mm)</option>
                      <option value="2.8">2.8 (Large - 63.5mm)</option>
                      <option value="2.10">2.10 (Extra Large - 66.7mm)</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── TAB 4: SAVED ADDRESSES ──────────────────────────── */}
          {activeTab === 'addresses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', margin: 0 }}>
                    Saved Shipping Addresses
                  </h2>
                  <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '2px' }}>
                    Manage delivery destinations for wedding venues and home delivery.
                  </p>
                </div>
                {!showAddAddress && (
                  <button onClick={() => setShowAddAddress(true)} className="btn btn-sm btn-primary">
                    + Add New Address
                  </button>
                )}
              </div>

              {/* Add Address Form Modal/Inline */}
              {showAddAddress && (
                <div className="card" style={{ padding: '24px', background: '#FFFDFB', border: '1.5px solid var(--pr)' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--dk)', marginBottom: '16px' }}>Add New Shipping Address</h3>
                  <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <label className="input-label">
                        <span>Address Label (e.g., Wedding Hall, Home)</span>
                        <input
                          type="text"
                          className="input"
                          required
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          placeholder="e.g. Wedding Mandapam"
                        />
                      </label>
                      <label className="input-label">
                        <span>Recipient Full Name</span>
                        <input
                          type="text"
                          className="input"
                          required
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <label className="input-label">
                        <span>Contact Phone</span>
                        <input
                          type="text"
                          className="input"
                          required
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        />
                      </label>
                      <label className="input-label">
                        <span>Street Address / Door No.</span>
                        <input
                          type="text"
                          className="input"
                          required
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                      <label className="input-label">
                        <span>City</span>
                        <input
                          type="text"
                          className="input"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </label>
                      <label className="input-label">
                        <span>State</span>
                        <input
                          type="text"
                          className="input"
                          required
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />
                      </label>
                      <label className="input-label">
                        <span>Pincode</span>
                        <input
                          type="text"
                          className="input"
                          required
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Address Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="card"
                    style={{
                      padding: '20px',
                      background: '#fff',
                      border: addr.isDefault ? '1.5px solid var(--pr)' : '1px solid var(--bd)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '180px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--dk)' }}>{addr.label}</span>
                        {addr.isDefault && <span className="tag tag-primary">Default</span>}
                      </div>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{addr.fullName}</div>
                      <div style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>
                        {addr.street}<br />
                        {addr.city}, {addr.state} - {addr.pincode}<br />
                        Phone: {addr.phone}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F0E8E6', fontSize: '13px' }}>
                      {!addr.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--pr)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', padding: 0 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 5: WISHLIST ─────────────────────────────────── */}
          {activeTab === 'wishlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', margin: 0 }}>
                    My Bridal Wishlist
                  </h2>
                  <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '2px' }}>
                    Saved pieces for your wedding trousseau and bridesmaid gifting.
                  </p>
                </div>
                <Link href="/shop" className="btn btn-sm btn-outline">
                  Add More Items
                </Link>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--tx2)' }}>Your wishlist is empty.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                  {wishlistItems.map((prod) => (
                    <div key={prod.id} className="card" style={{ padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', marginBottom: '12px' }}>
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            onClick={() => removeWishlist(prod.id)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(255,255,255,0.85)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--dk)',
                            }}
                            title="Remove from wishlist"
                          >
                            ×
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--tx2)', letterSpacing: '0.06em' }}>
                          {prod.category}
                        </div>
                        <h4 style={{ fontSize: '15px', margin: '4px 0 8px', color: 'var(--dk)' }}>
                          <Link href={`/product/${prod.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {prod.name}
                          </Link>
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--pr)', fontSize: '16px' }}>{fmt(prod.salePrice)}</span>
                          <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'var(--tx2)' }}>{fmt(prod.regularPrice)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          addItem(prod, prod.sizes[0] || 'Standard', undefined, undefined, 1)
                          removeWishlist(prod.id)
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        Move to Bag
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
