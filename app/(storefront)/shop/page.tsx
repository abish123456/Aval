'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PRODUCTS, CATEGORIES, Product } from '@/lib/data'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function ShopPage() {
  const { addItem } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSort, setSelectedSort] = useState<'featured' | 'low-high' | 'high-low'>('featured')
  const [onlyCustomisable, setOnlyCustomisable] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Filter
  let filtered = PRODUCTS.filter((p) => {
    if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory) return false
    if (onlyCustomisable && !p.customisable) return false
    return true
  })

  // Sort
  if (selectedSort === 'low-high') {
    filtered = [...filtered].sort((a, b) => a.salePrice - b.salePrice)
  } else if (selectedSort === 'high-low') {
    filtered = [...filtered].sort((a, b) => b.salePrice - a.salePrice)
  }

  const handleQuickAdd = (p: Product) => {
    addItem(p, p.sizes[0] || '2.6', undefined, undefined, 1)
    setToast(`Added ${p.name} to your Bag!`)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '90px' }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb" style={{ marginBottom: '16px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Shop All Collections</span>
      </nav>

      {/* Header & Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 5vw, 32px)', lineHeight: 1.2, color: 'var(--dk)', margin: 0 }}>
          {selectedCategory === 'all'
            ? 'All Handcrafted Designs'
            : CATEGORIES.find((c) => c.slug === selectedCategory)?.name || 'Bridal Collection'}
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--tx2)', marginTop: '4px' }}>
          Showing {filtered.length} authentic pieces handcrafted in Kanyakumari
        </div>
      </div>

      {/* Mobile Horizontal Category Chips */}
      <div className="mobile-category-chips">
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: selectedCategory === 'all' ? 600 : 500,
            background: selectedCategory === 'all' ? 'var(--pr)' : '#fff',
            color: selectedCategory === 'all' ? '#fff' : 'var(--dk)',
            border: '1px solid ' + (selectedCategory === 'all' ? 'var(--pr)' : 'var(--bd)'),
            borderRadius: 0,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          All ({PRODUCTS.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: selectedCategory === cat.slug ? 600 : 500,
              background: selectedCategory === cat.slug ? 'var(--pr)' : '#fff',
              color: selectedCategory === cat.slug ? '#fff' : 'var(--dk)',
              border: '1px solid ' + (selectedCategory === cat.slug ? 'var(--pr)' : 'var(--bd)'),
              borderRadius: 0,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="shop-layout-grid">
        {/* Left: Filter Sidebar (Desktop) */}
        <aside
          className="desktop-filter-sidebar card"
          style={{
            padding: '22px',
            background: '#fff',
            border: '1px solid var(--bd)',
            position: 'sticky',
            top: '80px',
            alignSelf: 'start',
            borderRadius: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--dk)', margin: 0, fontFamily: 'var(--font-serif)' }}>
              Filter Designs
            </h3>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setOnlyCustomisable(false)
                setSelectedSort('featured')
              }}
              style={{ background: 'none', border: 'none', color: 'var(--pr)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Reset
            </button>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Category
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cat"
                  checked={selectedCategory === 'all'}
                  onChange={() => setSelectedCategory('all')}
                />
                All Jewellery ({PRODUCTS.length})
              </label>
              {CATEGORIES.map((cat) => (
                <label key={cat.slug} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cat"
                    checked={selectedCategory === cat.slug}
                    onChange={() => setSelectedCategory(cat.slug)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          <div className="divider" style={{ margin: '16px 0' }} />

          {/* Customisable toggle */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Personalisation
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onlyCustomisable}
                onChange={(e) => setOnlyCustomisable(e.target.checked)}
              />
              Bride &amp; Groom Name Lettering
            </label>
          </div>

          <div className="divider" style={{ margin: '16px 0' }} />

          <div style={{ background: 'var(--bl2)', padding: '14px', borderRadius: 0, fontSize: '12px', color: 'var(--pr)', lineHeight: 1.5 }}>
            <strong>💡 Custom Bangle Sizes:</strong> Need custom diameter or extra kada thickness? Contact our artisans on WhatsApp.
          </div>
        </aside>

        {/* Right: Products Area */}
        <div style={{ minWidth: 0 }}>
          {/* Top Sort Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--tx2)' }}>
              Showing {filtered.length} designs
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--tx2)' }}>Sort by:</span>
              <select
                className="input"
                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', borderRadius: 0 }}
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as any)}
              >
                <option value="featured">Featured / Best Sellers</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="shop-product-grid">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{
                  overflow: 'hidden',
                  background: '#fff',
                  border: '1px solid var(--bd)',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 0,
                }}
              >
                <Link href={`/product/${p.slug}`} style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: 'var(--bl2)', display: 'block', textDecoration: 'none' }}>
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'var(--pr)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 0,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {p.discountPercent}% OFF
                  </span>
                  {p.isBestSeller && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'var(--dk)',
                        color: '#fff',
                        fontSize: '9.5px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Bestseller
                    </span>
                  )}
                </Link>

                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--tx2)', letterSpacing: '0.08em' }}>
                    {p.category}
                  </div>
                  <Link
                    href={`/product/${p.slug}`}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--dk)',
                      margin: '4px 0 8px',
                      textDecoration: 'none',
                      lineHeight: 1.3,
                    }}
                  >
                    {p.name}
                  </Link>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--pr)' }}>
                      {fmt(p.salePrice)}
                    </span>
                    <span style={{ textDecoration: 'line-through', color: 'var(--tx2)', fontSize: '12px' }}>
                      {fmt(p.regularPrice)}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <Link
                      href={`/product/${p.slug}`}
                      className="btn btn-outline"
                      style={{ padding: '8px 0', textAlign: 'center', fontSize: '12px', minHeight: '36px', borderRadius: 0 }}
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleQuickAdd(p)}
                      className="btn btn-primary"
                      style={{ padding: '8px 0', fontSize: '12px', minHeight: '36px', borderRadius: 0 }}
                    >
                      + Bag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '16px',
            left: '16px',
            maxWidth: '380px',
            margin: '0 auto',
            background: 'var(--dk)',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 0,
            zIndex: 1000,
            fontSize: '13px',
            fontWeight: 500,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(58,21,32,0.2)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
