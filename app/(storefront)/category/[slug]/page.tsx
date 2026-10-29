'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CATEGORIES, PRODUCTS, Product } from '@/lib/data'
import { useCart } from '@/context/CartContext'
import { useState, useEffect, Suspense } from 'react'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

interface ApiProduct {
  id: string
  name: string
  slug: string
  regularPricePaise: number
  salePricePaise: number
  stock: number
  customisable: boolean
  isBestSeller?: boolean
  isNew?: boolean
  rating: number
  reviewCount: number
  images?: string[]
  sizes?: string[]
  details?: string[]
  category?: { name: string; slug: string }
}

function CategoryContent() {
  const params = useParams()
  const slug = params?.slug as string
  const { addItem } = useCart()
  const [toast, setToast] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>(PRODUCTS)

  const category = CATEGORIES.find((c) => c.slug === slug) || {
    name: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Bridal Collection',
    slug: slug || 'bridal-bangles',
    description: 'Explore handcrafted bridal jewellery and accessories made with traditional precision in Kanyakumari.',
  }

  useEffect(() => {
    if (!slug) return
    fetch(`/api/products?category=${slug}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setProducts(
            res.data.data.map((p: ApiProduct) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              category: p.category?.name ?? category.name,
              categorySlug: p.category?.slug ?? slug,
              regularPrice: p.regularPricePaise / 100,
              salePrice: p.salePricePaise / 100,
              discountPercent: Math.round(((p.regularPricePaise - p.salePricePaise) / p.regularPricePaise) * 100),
              rating: p.rating || 5.0,
              reviewCount: p.reviewCount || 0,
              isBestSeller: p.isBestSeller,
              isNew: p.isNew,
              customisable: p.customisable,
              stock: p.stock,
              description: '',
              details: Array.isArray(p.details) ? p.details : [],
              images: Array.isArray(p.images) ? p.images : ['/images/hero_bangles.jpg'],
              sizes: Array.isArray(p.sizes) ? p.sizes : ['2.4', '2.6'],
            }))
          )
        }
      })
      .catch(() => {})
  }, [slug, category.name])

  const filteredProducts = products.filter(
    (p) => p.categorySlug === slug || slug === 'all'
  )
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products

  const handleQuickAdd = (product: typeof PRODUCTS[0]) => {
    addItem(product, product.sizes[0] || '2.6', undefined, undefined, 1)
    setToast(`Added ${product.name} to Bag!`)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>{category.name}</span>
      </nav>

      {/* Category Banner */}
      <div
        className="card"
        style={{
          padding: '36px',
          background: 'linear-gradient(135deg, #FBF4F2 0%, #F5E8E5 100%)',
          border: '1px solid var(--bd)',
          borderRadius: 0,
          marginBottom: '32px',
        }}
      >
        <span style={{ fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pr)', fontWeight: 600 }}>
          Kanyakumari Handcrafted Collection
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--dk)', marginTop: '4px', marginBottom: '8px' }}>
          {category.name}
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '15px', maxWidth: '640px', lineHeight: 1.6 }}>
          {category.description}
        </p>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
        {displayProducts.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{
              overflow: 'hidden',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '240px', background: 'var(--bl2)' }}>
              <img
                src={p.images[0]}
                alt={p.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'var(--pr)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '12px',
                }}
              >
                {p.discountPercent}% OFF
              </span>
            </div>

            <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--tx2)', letterSpacing: '0.08em' }}>
                {p.category}
              </div>
              <Link
                href={`/product/${p.slug}`}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--dk)',
                  margin: '4px 0 8px',
                  textDecoration: 'none',
                  lineHeight: 1.3,
                }}
              >
                {p.name}
              </Link>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--pr)' }}>
                  {fmt(p.salePrice)}
                </span>
                <span style={{ textDecoration: 'line-through', color: 'var(--tx2)', fontSize: '13px' }}>
                  {fmt(p.regularPrice)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/product/${p.slug}`}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: '13px' }}
                >
                  Details
                </Link>
                <button
                  onClick={() => handleQuickAdd(p)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px 0', fontSize: '13px' }}
                >
                  + Add to Bag
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--dk)',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading collection...</div>}>
      <CategoryContent />
    </Suspense>
  )
}
