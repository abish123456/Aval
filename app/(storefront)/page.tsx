import type { Metadata } from 'next'
import Link from 'next/link'
import { CATEGORIES, PRODUCTS, Product, Category } from '@/lib/data'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'AVAL Store — Handcrafted Bridal Accessories',
  description: 'Customised bangles, hair clips and wedding accessories handcrafted in Kanyakumari. Free shipping above ₹1,500.',
}

const FEATURES = [
  { icon: '✦', title: 'Handcrafted in Kanyakumari', desc: 'Every piece made by skilled heritage artisans' },
  { icon: '🌸', title: 'Personalised Sets', desc: 'Bride & groom names and dates lettered by hand' },
  { icon: '📦', title: 'Free Express Shipping', desc: 'On all orders above ₹1,499 across India' },
  { icon: '💎', title: 'Velvet Gift Trunk', desc: 'Complimentary signature trousseau presentation' },
]

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default async function HomePage() {
  let bestSellers: Product[] = PRODUCTS.slice(0, 4)
  let categories: Category[] = CATEGORIES

  try {
    const [dbProducts, dbCategories] = await Promise.all([
      prisma.product.findMany({
        where: { archived: false },
        take: 4,
        orderBy: [{ isBestSeller: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.category.findMany({
        where: { archived: false },
        take: 4,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
    ])

    if (dbProducts.length > 0) {
      bestSellers = dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category.name,
        categorySlug: p.category.slug,
        regularPrice: p.regularPricePaise / 100,
        salePrice: p.salePricePaise / 100,
        discountPercent: Math.round(((p.regularPricePaise - p.salePricePaise) / p.regularPricePaise) * 100),
        rating: p.rating,
        reviewCount: p.reviewCount,
        isBestSeller: p.isBestSeller,
        isNew: p.isNew,
        customisable: p.customisable,
        stock: p.stock,
        description: p.description,
        details: Array.isArray(p.details) ? (p.details as string[]) : [],
        images: Array.isArray(p.images) ? (p.images as string[]) : ['/images/hero_bangles.jpg'],
        sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : ['2.4', '2.6'],
      }))
    }

    if (dbCategories.length > 0) {
      categories = dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image || '/images/hero_bangles.jpg',
        itemCount: c._count.products,
        description: c.description,
      }))
    }
  } catch {
    // static fallback
  }

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero animate-fade-in">
        <div className="hero-content">
          <p className="hero-eyebrow">Handcrafted in Kanyakumari • Bridal Elegance</p>
          <h1 className="hero-title animate-fade-up" style={{ color: 'var(--dk)' }}>
            Crafted for the bride,<br />made by hand
          </h1>
          <p className="hero-subtitle animate-fade-up animate-delay-1">
            Customised silk thread Kundan bangles, royal hair ornaments, and bespoke wedding keepsakes personalised with your names and wedding date.
          </p>
          <div className="hero-actions animate-fade-up animate-delay-2">
            <Link href="/shop" className="btn btn-primary btn-lg">Shop Bridal Collection</Link>
            <Link href="/custom-order" className="btn btn-outline btn-lg">Request Custom Design</Link>
          </div>
        </div>
        <div
          className="hero-image"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 0,
            minHeight: '440px',
            border: '1px solid var(--bd)',
          }}
        >
          <img
            src="/images/hero_bangles.jpg"
            alt="Handcrafted Bridal Bangles"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(58,21,32,0.95) 0%, rgba(58,21,32,0.6) 75%, transparent 100%)',
              color: '#fff',
              padding: '24px 28px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.04em' }}>Kundan Royal Bridal Set</div>
              <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>Personalised with Bride &amp; Groom Names in Gold</div>
            </div>
            <Link href="/product/kundan-bridal-bangle-set" style={{ color: '#EBD3CF', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              View Piece →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Bar ─────────────────────────────────── */}
      <div style={{ background: 'var(--dk)', color: 'var(--bl)' }}>
        <div className="container">
          <div
            className="features-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 0,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  padding: '20px 24px',
                  borderRight: '1px solid rgba(235,211,207,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <span style={{ fontSize: '24px' }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px' }}>{f.title}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="row-between" style={{ marginBottom: '28px' }}>
            <div>
              <h2>Shop by Category</h2>
              <p style={{ color: 'var(--tx2)', fontSize: '14px', marginTop: '4px' }}>
                Curated collections handcrafted for South Indian weddings & muhurthams
              </p>
            </div>
            <Link href="/shop" className="btn btn-ghost" style={{ fontSize: '14px' }}>View all →</Link>
          </div>
          <div className="grid grid-auto" style={{ gap: '20px' }}>
            {categories.slice(0, 4).map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="cat-tile" style={{ textDecoration: 'none', position: 'relative', overflow: 'hidden', height: '220px', borderRadius: 0, border: '1px solid var(--bd)' }}>
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(58,21,32,0.9) 0%, rgba(58,21,32,0.2) 60%)',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                  <div className="cat-tile-label" style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>{cat.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                    {cat.itemCount} designs
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Best Sellers ─────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '60px 0' }}>
        <div className="container">
          <div className="row-between" style={{ marginBottom: '28px' }}>
            <div>
              <h2>Best Sellers</h2>
              <p style={{ color: 'var(--tx2)', fontSize: '14px', marginTop: '4px' }}>
                Our most celebrated bridal designs chosen by hundreds of brides
              </p>
            </div>
            <Link href="/shop" className="btn btn-ghost" style={{ fontSize: '14px' }}>Shop all →</Link>
          </div>
          <div className="grid grid-auto">
            {bestSellers.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="product-card" style={{ textDecoration: 'none', color: 'inherit', background: '#fff', borderRadius: 0, border: '1px solid var(--bd)', overflow: 'hidden' }}>
                <div className="product-card-image" style={{ height: '260px', position: 'relative' }}>
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="product-card-badge">
                    <span className="tag tag-primary">{p.discountPercent}% OFF</span>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--tx2)', letterSpacing: '0.08em' }}>
                    {p.category}
                  </div>
                  <div className="product-card-name" style={{ margin: '4px 0 8px', fontSize: '16px', fontWeight: 600 }}>
                    {p.name}
                  </div>
                  <div className="product-card-price">
                    <s style={{ color: 'var(--tx2)' }}>{fmt(p.regularPrice)}</s>
                    <strong style={{ color: 'var(--pr)', fontSize: '17px' }}>{fmt(p.salePrice)}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Combo Deal Promo ─────────────────────────────── */}
      <section className="container" style={{ margin: '60px auto' }}>
        <div className="promo-banner" style={{ background: 'linear-gradient(135deg, var(--pr) 0%, var(--dk) 100%)', borderRadius: 0, padding: '40px' }}>
          <div>
            <p className="promo-banner-eyebrow" style={{ color: '#EBD3CF' }}>Exclusive Wedding Combo</p>
            <h2 className="promo-banner-title" style={{ color: '#FBF7F3', fontSize: '32px', marginBottom: '8px' }}>
              Royal Kundan Bangles + Pearl Hair Comb
            </h2>
            <p className="promo-banner-sub" style={{ opacity: 0.9 }}>
              Get the complete wedding duo for ₹2,299 (Save ₹1,099). Free shipping &amp; luxury bridal trunk included.
            </p>
          </div>
          <Link href="/offers" className="btn" style={{ background: '#FBF7F3', color: 'var(--pr)', borderColor: '#FBF7F3', fontWeight: 600, padding: '12px 28px' }}>
            View Offer Details
          </Link>
        </div>
      </section>

      {/* ── Brand Story ──────────────────────────────────── */}
      <section className="section">
        <div className="container-sm" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <span className="label" style={{ color: 'var(--pr)', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}>Our Kanyakumari Heritage</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--dk)', fontFamily: 'var(--font-serif)' }}>
            Handcrafted bridal accessories,<br />made with love in Kanyakumari
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--tx2)', maxWidth: '580px' }}>
            Every bangle, every clip, every tiny detail is shaped by the hands of Kanyakumari artisans who carry forward centuries of jewellery traditions. We personalise each piece with your names, auspicious dates, and signature wedding saree tones.
          </p>
          <Link href="/about" className="btn btn-outline">Learn More About Our Craft</Link>
        </div>
      </section>

      {/* ── Custom Order CTA ─────────────────────────────── */}
      <section
        style={{
          background: 'var(--bl2)',
          padding: '72px var(--sp-xl)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <span className="label" style={{ color: 'var(--pr)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px' }}>
          Custom Design Studio
        </span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--dk)' }}>
          Request a Custom Bridal Creation
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--tx2)', maxWidth: '520px', lineHeight: 1.7 }}>
          Have a specific bridal lehenga or silk saree shade? Share your photos with our master craftsman to create a 1-of-1 personalised set.
        </p>
        <Link href="/custom-order" className="btn btn-primary btn-lg">Start a Custom Order</Link>
      </section>
    </div>
  )
}
