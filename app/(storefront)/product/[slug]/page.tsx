'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { PRODUCTS, Product } from '@/lib/data'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function ProductDetailContent() {
  const params = useParams()
  const slug = params?.slug as string

  // Look up product or fall back to first item
  const product: Product =
    PRODUCTS.find((p) => p.slug === slug) || PRODUCTS[0]

  const { addItem } = useCart()

  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '2.6')
  const [name, setName] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [qty, setQty] = useState(1)
  const [activeThumb, setActiveThumb] = useState(0)
  const [addedToast, setAddedToast] = useState(false)

  const customCharge = name.trim() ? 200 : 0
  const unitPrice = product.salePrice + customCharge
  const subtotal = unitPrice * qty

  const handleAddToCart = () => {
    addItem(product, selectedSize, name, weddingDate, qty)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 3000)
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb" style={{ marginBottom: '28px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <Link href={`/category/${product.categorySlug}`}>{product.category}</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>{product.name}</span>
      </nav>

      {/* Main product layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px' }}>
        {/* Left: Gallery */}
        <div>
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 0,
              overflow: 'hidden',
              background: 'var(--bl2)',
              position: 'relative',
              border: '1px solid var(--bd)',
            }}
          >
            <img
              src={product.images[activeThumb] || product.images[0]}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {product.isBestSeller && (
              <span
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'var(--pr)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 0,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Best Seller
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumb(idx)}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: 0,
                    overflow: 'hidden',
                    border: activeThumb === idx ? '2px solid var(--pr)' : '1px solid var(--bd)',
                    cursor: 'pointer',
                    padding: 0,
                    background: 'none',
                    opacity: activeThumb === idx ? 1 : 0.7,
                    transition: 'all 0.2s',
                  }}
                >
                  <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          {/* Highlights */}
          <div className="card" style={{ marginTop: '28px', padding: '20px', background: 'var(--bg2)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--dk)' }}>
              Handcraft Specifications
            </h4>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--tx2)', lineHeight: 1.8 }}>
              {product.details.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Details & Purchase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <span style={{ fontSize: '12px', letterSpacing: '0.12em', color: 'var(--pr)', textTransform: 'uppercase', fontWeight: 600 }}>
              {product.category}
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--dk)', marginTop: '4px', lineHeight: 1.2 }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <div style={{ color: '#D97706', fontSize: '14px' }}>★★★★★</div>
              <span style={{ fontSize: '13px', color: 'var(--tx2)' }}>
                {product.rating} ({product.reviewCount} verified reviews)
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 700, color: 'var(--pr)' }}>
              {fmt(product.salePrice)}
            </span>
            <span style={{ textDecoration: 'line-through', color: 'var(--tx2)', fontSize: '18px' }}>
              {fmt(product.regularPrice)}
            </span>
            <span style={{ background: '#dcefe1', color: 'var(--ok)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
              Save {product.discountPercent}%
            </span>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--tx2)', lineHeight: 1.6 }}>
            {product.description}
          </p>

          <div className="divider" style={{ margin: '4px 0' }} />

          {/* Size selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)' }}>
                Select Size (Indian Bangle Standard)
              </label>
              <span style={{ fontSize: '12px', color: 'var(--pr)', cursor: 'pointer', textDecoration: 'underline' }}>
                Size Guide
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 0,
                    border: selectedSize === s ? '2px solid var(--pr)' : '1px solid var(--bd)',
                    background: selectedSize === s ? 'var(--bl2)' : 'var(--cd)',
                    color: selectedSize === s ? 'var(--pr)' : 'var(--tx)',
                    fontWeight: selectedSize === s ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Customisation inputs */}
          {product.customisable && (
            <div className="card" style={{ padding: '18px', background: 'var(--bl2)', border: '1px dashed var(--pr)', borderRadius: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--pr)' }}>
                  Personalise this set (+ ₹200)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--tx2)' }}>Hand-lettered with protective glaze</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--tx2)', marginBottom: '4px', display: 'block' }}>
                    Couple Names or Initials (e.g., Priya & Karthik)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter bride & groom names..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ background: '#fff', borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--tx2)', marginBottom: '4px', display: 'block' }}>
                    Wedding / Engagement Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    style={{ background: '#fff', borderRadius: 0 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantity & CTA */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--bd)', borderRadius: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ width: '38px', height: '44px', border: 'none', background: 'var(--bg2)', cursor: 'pointer', fontSize: '16px' }}
              >
                −
              </button>
              <span style={{ width: '40px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                style={{ width: '38px', height: '44px', border: 'none', background: 'var(--bg2)', cursor: 'pointer', fontSize: '16px' }}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn btn-primary"
              style={{ flex: 1, height: '46px', fontSize: '14px', fontWeight: 600, letterSpacing: '0.04em', borderRadius: 0 }}
            >
              Add to Bag • {fmt(subtotal)}
            </button>
          </div>

          <Link
            href="/cart"
            onClick={handleAddToCart}
            className="btn btn-secondary"
            style={{ width: '100%', height: '44px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}
          >
            Buy Now with Express Checkout
          </Link>

          {/* Trust badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', textAlign: 'center', fontSize: '11px', color: 'var(--tx2)' }}>
            <div style={{ padding: '8px 4px', background: 'var(--bg2)', borderRadius: 0 }}>
              ✨ 100% Handcrafted
            </div>
            <div style={{ padding: '8px 4px', background: 'var(--bg2)', borderRadius: 0 }}>
              🚚 Free Shipping &gt; ₹1.5k
            </div>
            <div style={{ padding: '8px 4px', background: 'var(--bg2)', borderRadius: 0 }}>
              🎁 Velvet Bridal Box
            </div>
          </div>
        </div>
      </div>

      {/* Added to Bag Toast Notification */}
      {addedToast && (
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
            padding: '14px 20px',
            borderRadius: 0,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1000,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Added to your Bag!</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {product.name} ({selectedSize})
            </div>
          </div>
          <Link
            href="/cart"
            style={{
              background: 'var(--pr)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 0,
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View Bag →
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading bridal accessory...</div>}>
      <ProductDetailContent />
    </Suspense>
  )
}
