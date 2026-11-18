'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Quote {
  name: string
  description: string
  weddingDate: string | null
  status: string
  quotePricePaise: number | null
  quoteNote: string | null
  quoteExpiresAt: string | null
  expired: boolean
  orderToken: string | null
}

function rupees(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'var(--dk)', display: 'block', marginBottom: '6px' }

export default function QuotePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'accept' | 'decline'>('view')
  const [form, setForm] = useState({ whatsapp: '', street: '', city: '', state: 'Tamil Nadu', pincode: '' })
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/quotes/${token}`, { cache: 'no-store' })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}))
        if (cancelled) return
        if (r.ok && json.success) setQuote(json.data)
        else setLoadError(r.status === 404 ? 'This quote link is not valid.' : 'Could not load the quote. Please try again.')
      })
      .catch(() => !cancelled && setLoadError('Could not load the quote. Check your connection.'))
    return () => {
      cancelled = true
    }
  }, [token])

  async function submit(action: 'ACCEPT' | 'DECLINE') {
    setBusy(true)
    setError(null)
    try {
      const body =
        action === 'ACCEPT'
          ? { action, whatsapp: form.whatsapp, address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode } }
          : { action, reason: reason || undefined }
      const r = await fetch(`/api/quotes/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await r.json().catch(() => ({}))
      if (!r.ok || !json.success) {
        setError(typeof json.error === 'string' ? json.error : 'Something went wrong. Please try again.')
        return
      }
      if (action === 'ACCEPT' && json.data?.redirect) {
        router.push(json.data.redirect)
        return
      }
      setDone(json.data?.message ?? 'Thank you.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const wrap = (children: React.ReactNode) => (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px', maxWidth: '640px' }}>
      {children}
    </div>
  )

  if (loadError) {
    return wrap(
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)' }}>Quote not available</h1>
        <p style={{ color: 'var(--tx2)' }}>{loadError}</p>
        <Link href="/contact" className="btn btn-primary">Contact us</Link>
      </div>
    )
  }
  if (!quote) return wrap(<p style={{ color: 'var(--tx2)' }} aria-busy="true">Loading your quote…</p>)

  const open = quote.status === 'QUOTE_SENT' && !quote.expired

  return wrap(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <span style={{ fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pr)', fontWeight: 600 }}>Your custom quote</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--dk)', margin: '4px 0 0' }}>Vanakkam, {quote.name}</h1>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ color: 'var(--tx2)', fontSize: '14px' }}>Your request</div>
        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{quote.description}</p>
        {quote.weddingDate && <div style={{ fontSize: '14px' }}>Wedding date: <strong>{quote.weddingDate}</strong></div>}
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: '12px' }}>
          <div style={{ color: 'var(--tx2)', fontSize: '14px' }}>Our price, including delivery</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '34px', fontWeight: 700, color: 'var(--pr)' }}>{quote.quotePricePaise ? rupees(quote.quotePricePaise) : '—'}</div>
        </div>
        {quote.quoteNote && (
          <div style={{ background: 'var(--bg)', padding: '12px 14px', fontSize: '14px', whiteSpace: 'pre-line' }}>
            <strong>Note from our artisan:</strong> {quote.quoteNote}
          </div>
        )}
        {quote.quoteExpiresAt && open && (
          <div style={{ fontSize: '13px', color: 'var(--tx2)' }}>
            Valid until {new Date(quote.quoteExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {done ? (
        <div role="status" className="card" style={{ padding: '20px' }}>{done}</div>
      ) : !open ? (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0 }}>
            {quote.expired
              ? 'This quote has expired. Message us and we will send a fresh one.'
              : quote.status === 'QUOTE_DECLINED'
              ? 'You declined this quote. Message us if you would like a different design or price.'
              : 'You accepted this quote.'}
          </p>
          {quote.orderToken ? (
            <Link href={`/o/${quote.orderToken}`} className="btn btn-primary">Open my order</Link>
          ) : (
            <Link href="/contact" className="btn btn-outline">Contact us</Link>
          )}
        </div>
      ) : mode === 'view' ? (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => setMode('accept')}>Accept &amp; continue to payment</button>
          <button type="button" className="btn btn-outline" onClick={() => setMode('decline')}>Decline</button>
        </div>
      ) : mode === 'accept' ? (
        <form onSubmit={(e) => { e.preventDefault(); submit('ACCEPT') }} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: 0, color: 'var(--dk)' }}>Where should we deliver?</h2>
          <div>
            <label htmlFor="q-wa" style={labelStyle}>WhatsApp number *</label>
            <input id="q-wa" className="input" type="tel" inputMode="numeric" autoComplete="tel-national" required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="9876543210" />
            <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '4px' }}>The last 4 digits unlock your private order page.</div>
          </div>
          <div>
            <label htmlFor="q-street" style={labelStyle}>Street address *</label>
            <input id="q-street" className="input" autoComplete="street-address" required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div>
              <label htmlFor="q-city" style={labelStyle}>City *</label>
              <input id="q-city" className="input" autoComplete="address-level2" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label htmlFor="q-state" style={labelStyle}>State *</label>
              <input id="q-state" className="input" autoComplete="address-level1" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label htmlFor="q-pin" style={labelStyle}>Pincode *</label>
              <input id="q-pin" className="input" inputMode="numeric" autoComplete="postal-code" required maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
            </div>
          </div>
          {error && <div role="alert" style={{ color: 'var(--er)', background: 'var(--er-bg)', padding: '10px 12px', fontSize: '14px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Confirming…' : `Confirm order · ${quote.quotePricePaise ? rupees(quote.quotePricePaise) : ''}`}</button>
            <button type="button" className="btn btn-outline" onClick={() => setMode('view')}>Back</button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit('DECLINE') }} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label htmlFor="q-reason" style={labelStyle}>Tell us why (optional) so we can suggest something better</label>
          <textarea id="q-reason" className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          {error && <div role="alert" style={{ color: 'var(--er)', background: 'var(--er-bg)', padding: '10px 12px', fontSize: '14px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Decline quote'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setMode('view')}>Back</button>
          </div>
        </form>
      )}
    </div>
  )
}
