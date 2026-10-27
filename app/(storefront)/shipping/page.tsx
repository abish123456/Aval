import Link from 'next/link'

export const metadata = {
  title: 'Shipping & Returns — AVAL Store',
  description: 'Delivery timelines, express courier partners, and return policies for handcrafted jewellery.',
}

export default function ShippingPage() {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Shipping &amp; Returns</span>
      </nav>

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', color: 'var(--dk)', marginBottom: '12px' }}>
          Shipping &amp; Return Policy
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '15px', marginBottom: '36px' }}>
          Everything you need to know about how your handcrafted wedding accessories are packaged and delivered.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '15px', color: 'var(--tx)', lineHeight: 1.8 }}>
          <div className="card" style={{ padding: '28px', background: '#fff' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', marginBottom: '12px' }}>
              Domestic Shipping (Across India)
            </h2>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Free Shipping:</strong> On all orders above ₹1,499.</li>
              <li><strong>Standard Shipping:</strong> Flat ₹99 for orders below ₹1,499.</li>
              <li><strong>Courier Partners:</strong> Dispatched via insured express couriers (Delhivery, Bluedart, DTDC).</li>
              <li><strong>Tracking:</strong> You receive an SMS and WhatsApp tracking link immediately upon dispatch.</li>
            </ul>
          </div>

          <div className="card" style={{ padding: '28px', background: '#fff' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', marginBottom: '12px' }}>
              Handcrafting &amp; Dispatch Timeline
            </h2>
            <p>
              Because every piece is handcrafted in Kanyakumari:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Ready Designs:</strong> Dispatched within 24–48 hours.</li>
              <li><strong>Personalised Name &amp; Date Sets:</strong> Require 4–6 business days for hand-lettering and waterproof resin coating.</li>
              <li><strong>Transit Time:</strong> Metro cities (2–3 days), rest of India (4–5 days).</li>
            </ul>
          </div>

          <div className="card" style={{ padding: '28px', background: '#fff' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', marginBottom: '12px' }}>
              Returns &amp; Exchanges
            </h2>
            <p>
              We want you to feel completely radiant on your wedding day. If a non-customised item arrives damaged or the size does not fit, contact us within 7 days of delivery for an instant exchange or refund.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--tx2)', marginTop: '8px' }}>
              * Note: Custom personalised bangles with embossed names and wedding dates cannot be returned, but if there is any sizing error or transit damage on our part, we will remake and expedite a fresh set at no extra cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
