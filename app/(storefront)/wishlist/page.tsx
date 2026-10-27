'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PRODUCTS } from '@/lib/data'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function WishlistPage() {
  const [savedItems, setSavedItems] = useState([PRODUCTS[0], PRODUCTS[3]])
  const { addItem } = useCart()
  const [toast, setToast] = useState<string | null>(null)

  const handleMoveToBag = (p: typeof PRODUCTS[0]) => {
    addItem(p, p.sizes[0] || '2.6', undefined, undefined, 1)
    setSavedItems(savedItems.filter((item) => item.id !== p.id))
    setToast(`Moved ${p.name} to your Bag!`)
    setTimeout(() => setToast(null), 2500)
  }

  const handleRemove = (id: string) => {
    setSavedItems(savedItems.filter((item) => item.id !== id))
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Saved Favourites</span>
      </nav>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--dk)', marginBottom: '8px' }}>
          Your Bridal Wishlist ({savedItems.length})
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '14px' }}>
          Saved pieces for your wedding trousseau and bridesmaid gifts.
        </p>
      </div>

      {savedItems.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤍</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--dk)', marginBottom: '8px' }}>
            No saved favourites yet
          </h2>
          <p style={{ color: 'var(--tx2)', fontSize: '14px', marginBottom: '20px' }}>
            Explore our collection and click the heart icon on any piece you love.
          </p>
          <Link href="/shop" className="btn btn-primary">
            Explore Handcrafted Jewellery
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
          {savedItems.map((p) => (
            <div key={p.id} className="card" style={{ overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: '240px', background: 'var(--bl2)' }}>
                <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => handleRemove(p.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  title="Remove from wishlist"
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--tx2)', letterSpacing: '0.08em' }}>
                  {p.category}
                </div>
                <Link
                  href={`/product/${p.slug}`}
                  style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--dk)', margin: '4px 0 8px', textDecoration: 'none' }}
                >
                  {p.name}
                </Link>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--pr)' }}>{fmt(p.salePrice)}</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--tx2)', fontSize: '13px' }}>{fmt(p.regularPrice)}</span>
                </div>
                <button
                  onClick={() => handleMoveToBag(p)}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  Move to Bag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--dk)', color: '#fff', padding: '14px 20px', borderRadius: '8px', zIndex: 1000, fontSize: '13px' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
