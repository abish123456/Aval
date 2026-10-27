'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PRODUCTS } from '@/lib/data'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { addItem } = useCart()
  const [toast, setToast] = useState<string | null>(null)

  const results = PRODUCTS.filter((p) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    )
  })

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Search Jewellery</span>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--dk)', marginBottom: '16px' }}>
          Search Handcrafted Designs
        </h1>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="input"
            placeholder="Search bangles, hair clips, Kundan, pearl..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ height: '52px', fontSize: '16px', paddingLeft: '20px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
        {results.map((p) => (
          <div key={p.id} className="card" style={{ overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', width: '100%', height: '240px', background: 'var(--bl2)' }}>
              <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--pr)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px' }}>
                {p.discountPercent}% OFF
              </span>
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/product/${p.slug}`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center', fontSize: '13px' }}>
                  Details
                </Link>
                <button
                  onClick={() => {
                    addItem(p, p.sizes[0] || '2.6', undefined, undefined, 1)
                    setToast(`Added ${p.name} to Bag!`)
                    setTimeout(() => setToast(null), 2500)
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  + Add to Bag
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--dk)', color: '#fff', padding: '14px 20px', borderRadius: '8px', zIndex: 1000, fontSize: '13px' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
