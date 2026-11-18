import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublicCoupons, couponHeadline } from '@/src/server/catalog'
import ApplyCouponButton from './ApplyCouponButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Offers',
  description: 'Current coupon codes for AVAL Store handcrafted bridal accessories.',
}

export default async function OffersPage() {
  const coupons = await listPublicCoupons()

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Offers</span>
      </nav>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '34px', color: 'var(--dk)', marginBottom: '8px' }}>
          Wedding Offers
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '15px', maxWidth: '640px' }}>
          Apply a code here and it is added to your bag. The discount is checked and shown in your bag before you place the order.
        </p>
      </div>

      {coupons.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>
          <p style={{ marginBottom: '16px' }}>There are no open offers right now. New wedding-season offers are announced here.</p>
          <Link href="/shop" className="btn btn-primary">Browse the collection</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {coupons.map((c) => (
            <div key={c.code} className="card" style={{ padding: '24px', background: '#fff', border: '1px dashed var(--pr)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>{couponHeadline(c)}</h2>
              {c.description && <p style={{ color: 'var(--tx2)', fontSize: '14px', margin: 0 }}>{c.description}</p>}
              <p style={{ color: 'var(--tx2)', fontSize: '12px', margin: 0 }}>
                {c.minSpendPaise > 0 ? `On orders of ₹${Math.round(c.minSpendPaise / 100).toLocaleString('en-IN')} or more` : 'No minimum order'}
                {c.expiresAt ? ` · Valid until ${c.expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: 'auto', paddingTop: '12px' }}>
                <code style={{ fontWeight: 700, color: 'var(--pr)', fontSize: '15px', letterSpacing: '0.05em' }}>{c.code}</code>
                <ApplyCouponButton code={c.code} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '28px', marginTop: '36px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', margin: '0 0 4px' }}>Planning a full bridal set?</h2>
          <p style={{ color: 'var(--tx2)', fontSize: '14px', margin: 0 }}>Tell us your saree colours and wedding date and we will quote a matching set.</p>
        </div>
        <Link href="/custom-order" className="btn btn-primary">Request a custom set</Link>
      </div>
    </div>
  )
}
