'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PRODUCTS } from '@/lib/data'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function OffersPage() {
  const { addItem, applyCoupon } = useCart()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [addedToast, setAddedToast] = useState(false)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    applyCoupon(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 3000)
  }

  const handleAddBundle = () => {
    // Add first 2 products as a bundle
    addItem(PRODUCTS[0], '2.6', 'Bridal Combo Set', undefined, 1)
    addItem(PRODUCTS[1], 'Standard (12cm)', undefined, undefined, 1)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 3000)
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Offers & Combo Deals</span>
      </nav>

      {/* Hero Offer Banner */}
      <div
        className="card"
        style={{
          padding: '40px 32px',
          background: 'linear-gradient(135deg, #7A1026 0%, #3A1520 100%)',
          color: '#fff',
          borderRadius: '12px',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Special Muhurtham Season Sale
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', marginBottom: '12px' }}>
          Up to 35% Off On Bridal Trousseau Bundles
        </h1>
        <p style={{ maxWidth: '560px', opacity: 0.85, fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
          Coordinate your wedding bangles, poola jada hair pieces, and bridesmaid gifts in one bespoke curated order.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7 }}>Coupon</span>
            <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.05em' }}>AVALWEDDING</div>
          </div>
          <button
            onClick={() => handleCopy('AVALWEDDING')}
            className="btn"
            style={{ background: '#fff', color: 'var(--pr)', fontWeight: 600, padding: '0 24px' }}
          >
            {copiedCode === 'AVALWEDDING' ? '✓ Applied & Copied!' : 'Apply Code AVALWEDDING'}
          </button>
        </div>
      </div>

      {/* Available Coupon Cards */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', marginBottom: '18px' }}>
          Available Store Coupons
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[
            {
              code: 'AVALWEDDING',
              title: 'Flat ₹300 Off',
              desc: 'Applicable on any order above ₹1,499. Includes free shipping.',
              tag: 'Most Popular',
            },
            {
              code: 'FIRST500',
              title: 'Welcome ₹500 Off',
              desc: 'For first-time brides placing complete custom bridal sets above ₹2,500.',
              tag: 'New Brides',
            },
            {
              code: 'BRIDAL10',
              title: '10% Bridesmaid Discount',
              desc: 'Special bulk order concession for bridesmaid sets and gift boxes.',
              tag: 'Bulk Special',
            },
          ].map((c) => (
            <div key={c.code} className="card" style={{ padding: '24px', background: '#fff', border: '1px dashed var(--pr)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ background: 'var(--bl2)', color: 'var(--pr)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  {c.tag}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>Valid this month</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', margin: '4px 0' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--tx2)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                {c.desc}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)', padding: '8px 12px', borderRadius: '6px' }}>
                <code style={{ fontWeight: 700, color: 'var(--pr)', fontSize: '14px' }}>{c.code}</code>
                <button
                  onClick={() => handleCopy(c.code)}
                  style={{ background: 'none', border: 'none', color: 'var(--pr)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                >
                  {copiedCode === c.code ? '✓ Applied' : 'Copy & Apply'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Combo Box */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', marginBottom: '18px' }}>
          Curated Bridal Combo Sets
        </h2>
        <div
          className="card"
          style={{
            padding: '32px',
            background: '#fff',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <img
              src={PRODUCTS[0].images[0]}
              alt="Bangles"
              style={{ width: '48%', height: '220px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <img
              src={PRODUCTS[1].images[0]}
              alt="Hair Clip"
              style={{ width: '48%', height: '220px', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>

          <div>
            <span style={{ background: '#dcefe1', color: 'var(--ok)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
              Special Wedding Combo Deal
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', marginTop: '8px', marginBottom: '8px' }}>
              Royal Muhurtham Duo: Kundan Bangles + Pearl Hair Comb
            </h3>
            <p style={{ color: 'var(--tx2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
              Includes 1 complete pair of Royal Kundan Bridal Bangles with silk thread customization AND the freshwater pearl bridal hair clip. Shipped in our velvet presentation box.
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--pr)' }}>
                ₹2,299
              </span>
              <span style={{ textDecoration: 'line-through', color: 'var(--tx2)', fontSize: '16px' }}>
                ₹3,398
              </span>
              <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: '13px' }}>
                You save ₹1,099 (32%)
              </span>
            </div>

            <button
              onClick={handleAddBundle}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 600 }}
            >
              Add Combo to Bag
            </button>
          </div>
        </div>
      </div>

      {addedToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--dk)',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '8px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>✨ Bridal Combo added to your Bag!</span>
          <Link href="/cart" style={{ color: 'var(--bl)', fontWeight: 600, textDecoration: 'underline' }}>
            View Bag
          </Link>
        </div>
      )}
    </div>
  )
}
