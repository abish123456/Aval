import Link from 'next/link'

export const metadata = {
  title: 'About AVAL — Handcrafted in Kanyakumari',
  description: 'Our heritage of crafting bespoke bridal bangles and wedding jewellery at the southern tip of India in Kanyakumari.',
}

export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>About Us</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pr)', fontWeight: 600 }}>
            Heritage &amp; Craft
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 42px)', color: 'var(--dk)', marginTop: '8px', marginBottom: '14px' }}>
            The Story Behind AVAL
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '16px', lineHeight: 1.8 }}>
            Born in Kanyakumari, AVAL represents the timeless grace of South Indian bridal traditions, hand-fashioned by master craftswomen.
          </p>
        </div>

        <div style={{ width: '100%', height: '360px', borderRadius: 0, overflow: 'hidden', marginBottom: '40px', border: '1px solid var(--bd)' }}>
          <img
            src="/images/hero_bangles.jpg"
            alt="Artisans at work in Kanyakumari"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '15px', color: 'var(--tx)', lineHeight: 1.8 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)' }}>
            Kanyakumari: Heritage &amp; Coastal Artistry
          </h2>
          <p>
            Rooted in the coastal heritage of Kanyakumari, AVAL was founded with a singular purpose: to bring the intimacy and authentic artisanal touch back to modern bridal trousseaus.
          </p>
          <p>
            In an era of mass-produced plastic ornaments, every single piece in our studio is wrapped with genuine pure silk thread, embellished with fine Kundan stones, and carefully lettered with the couple&apos;s names and auspicious wedding muhurtham dates.
          </p>

          <div className="card" style={{ padding: '28px', background: 'var(--bl2)', borderRadius: 0, border: '1px solid var(--bd)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--pr)', marginBottom: '8px' }}>
              Our Promise to Every Bride
            </h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--dk)', lineHeight: 1.8 }}>
              <li><strong>Zero Mass-Production:</strong> Each set is made only after your order is confirmed.</li>
              <li><strong>Exact Color Matching:</strong> We match your wedding saree or lehenga borders.</li>
              <li><strong>Fair Artisan Wages:</strong> Supporting skilled women craftswomen across Kanyakumari.</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href="/custom-order" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '15px', borderRadius: 0 }}>
              Design Your Custom Bridal Set
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
