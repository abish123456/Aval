'use client'

import React, { useState } from 'react'
import { PageHeader, Notice, useAdminData, useFlash, FlashMessage, adminRequest, rupees, formatDate } from '../_components/ui'

type Status = 'PENDING' | 'QUOTE_SENT' | 'QUOTE_ACCEPTED' | 'QUOTE_DECLINED' | 'QUOTE_EXPIRED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED'

interface CustomRequest {
  id: string
  name: string
  email: string
  phone: string
  description: string
  budget: string | null
  weddingDate: string | null
  occasion: string | null
  status: Status
  quoteToken: string | null
  quotePricePaise: number | null
  quoteNote: string | null
  quoteSentAt: string | null
  quoteExpiresAt: string | null
  createdAt: string
}

const LABEL: Record<Status, string> = {
  PENDING: 'New',
  QUOTE_SENT: 'Quote sent',
  QUOTE_ACCEPTED: 'Accepted',
  QUOTE_DECLINED: 'Declined',
  QUOTE_EXPIRED: 'Quote expired',
  IN_PRODUCTION: 'In production',
  COMPLETED: 'Completed',
  CANCELLED: 'Closed',
}
const TAG: Record<Status, string> = {
  PENDING: 'tag-warning',
  QUOTE_SENT: 'tag-blush',
  QUOTE_ACCEPTED: 'tag-ok',
  QUOTE_DECLINED: 'tag-error',
  QUOTE_EXPIRED: 'tag-error',
  IN_PRODUCTION: 'tag-blush',
  COMPLETED: 'tag-ok',
  CANCELLED: 'tag-error',
}
const FILTERS: { key: string; label: string; match: (s: Status) => boolean }[] = [
  { key: 'open', label: 'Needs action', match: (s) => s === 'PENDING' || s === 'QUOTE_DECLINED' || s === 'QUOTE_EXPIRED' || s === 'QUOTE_ACCEPTED' },
  { key: 'sent', label: 'Waiting on customer', match: (s) => s === 'QUOTE_SENT' },
  { key: 'production', label: 'In production', match: (s) => s === 'IN_PRODUCTION' },
  { key: 'closed', label: 'Done / closed', match: (s) => s === 'COMPLETED' || s === 'CANCELLED' },
  { key: 'all', label: 'All', match: () => true },
]
const CAN_QUOTE: Status[] = ['PENDING', 'QUOTE_SENT', 'QUOTE_DECLINED', 'QUOTE_EXPIRED']

function whatsappLink(phone: string, text: string) {
  const d = phone.replace(/\D/g, '')
  return `https://wa.me/${d.length === 10 ? '91' + d : d}?text=${encodeURIComponent(text)}`
}

export default function AdminCustomOrdersPage() {
  const { data, error, loading, reload } = useAdminData<CustomRequest[]>('/api/custom-orders')
  const [filter, setFilter] = useState('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [validDays, setValidDays] = useState('7')
  const [busy, setBusy] = useState(false)
  const [lastQuoteUrl, setLastQuoteUrl] = useState<string | null>(null)
  const [flash, showFlash, clearFlash] = useFlash()

  const rows = (data ?? []).filter((r) => FILTERS.find((f) => f.key === filter)?.match(r.status))
  const selected = (data ?? []).find((r) => r.id === selectedId) ?? rows[0] ?? null
  const quoteUrl = (r: CustomRequest) => (r.quoteToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/${r.quoteToken}` : null)

  function select(r: CustomRequest) {
    setSelectedId(r.id)
    setPrice(r.quotePricePaise ? String(r.quotePricePaise / 100) : '')
    setNote(r.quoteNote ?? '')
    setLastQuoteUrl(null)
  }

  async function sendQuote(r: CustomRequest) {
    const rupeesValue = Number(price)
    if (!Number.isFinite(rupeesValue) || rupeesValue <= 0) return showFlash('error', 'Enter the quote amount in rupees.')
    if (note.trim().length < 5) return showFlash('error', 'Add a short note for the customer (what is included, timeline).')
    setBusy(true)
    const res = await adminRequest<{ quoteUrl: string }>(`/api/admin/custom-orders/${r.id}/quote`, 'POST', {
      quotePricePaise: Math.round(rupeesValue * 100),
      quoteNote: note.trim(),
      validDays: Math.min(30, Math.max(1, Number(validDays) || 7)),
    })
    setBusy(false)
    if (!res.ok) return showFlash('error', res.error ?? 'Quote not sent.')
    setLastQuoteUrl(res.data?.quoteUrl ?? null)
    showFlash('ok', 'Quote saved and emailed. You can also send the link on WhatsApp.')
    reload()
  }

  async function setStatus(r: CustomRequest, status: 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED') {
    setBusy(true)
    const res = await adminRequest(`/api/admin/custom-orders/${r.id}`, 'PATCH', { status })
    setBusy(false)
    if (!res.ok) return showFlash('error', res.error ?? 'Not updated.')
    showFlash('ok', `Marked ${LABEL[status].toLowerCase()}.`)
    reload()
  }

  const url = selected ? lastQuoteUrl ?? quoteUrl(selected) : null

  return (
    <div>
      <PageHeader title="Custom Requests" subtitle="Bespoke design requests from the Custom Order form. Send a quote; when the customer accepts, it becomes a payable order under Bridal Orders." />

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-outline'}`}
          >
            {f.label} ({(data ?? []).filter((r) => f.match(r.status)).length})
          </button>
        ))}
      </div>

      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : loading && !data ? (
        <Notice>Loading requests…</Notice>
      ) : (data ?? []).length === 0 ? (
        <Notice>No custom requests yet. They appear here when a customer submits the Custom Order form.</Notice>
      ) : (
        <div className="admin-two-col-grid">
          <div className="card" style={{ padding: '8px 16px', overflowX: 'auto' }}>
            {rows.length === 0 ? (
              <p style={{ color: 'var(--tx2)', padding: '20px 0' }}>Nothing in this view.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Customer</th><th>Wedding</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => select(r)} style={{ cursor: 'pointer', background: selected?.id === r.id ? 'var(--bl2)' : undefined }}>
                      <td>
                        <button type="button" onClick={() => select(r)} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>Received {formatDate(r.createdAt)}</div>
                        </button>
                      </td>
                      <td style={{ fontSize: '13px' }}>{r.weddingDate || '—'}</td>
                      <td><span className={`tag ${TAG[r.status]}`}>{LABEL[r.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>{selected.name}</h2>
                  <div style={{ fontSize: '13px', color: 'var(--tx2)' }}>{selected.phone} · {selected.email}</div>
                </div>
                <span className={`tag ${TAG[selected.status]}`} style={{ alignSelf: 'flex-start' }}>{LABEL[selected.status]}</span>
              </div>

              <div style={{ background: 'var(--bg)', padding: '12px', fontSize: '14px', whiteSpace: 'pre-line' }}>{selected.description}</div>
              <div style={{ fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {selected.weddingDate && <span>Wedding: <strong>{selected.weddingDate}</strong></span>}
                {selected.budget && <span>Budget: <strong>{selected.budget}</strong></span>}
                {selected.occasion && <span>Occasion: <strong>{selected.occasion}</strong></span>}
              </div>

              {selected.quotePricePaise && (
                <div style={{ fontSize: '13px' }}>
                  Last quote: <strong>{rupees(selected.quotePricePaise)}</strong>
                  {selected.quoteSentAt ? ` · sent ${formatDate(selected.quoteSentAt)}` : ''}
                  {selected.quoteExpiresAt ? ` · valid to ${formatDate(selected.quoteExpiresAt)}` : ''}
                </div>
              )}

              {url && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12px' }}>
                  <a href={url} target="_blank" style={{ overflowWrap: 'anywhere' }}>Customer quote page</a>
                  <a
                    className="btn btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={whatsappLink(selected.phone, `Vanakkam ${selected.name}! Your AVAL custom quote is ready: ${url}`)}
                  >
                    Send link on WhatsApp
                  </a>
                </div>
              )}

              {CAN_QUOTE.includes(selected.status) && (
                <form onSubmit={(e) => { e.preventDefault(); sendQuote(selected) }} style={{ borderTop: '1px solid var(--bd)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <strong style={{ fontSize: '14px' }}>{selected.status === 'PENDING' ? 'Send a quote' : 'Send a new quote'}</strong>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '12px', flex: '1 1 140px' }}>
                      Price incl. delivery (₹)
                      <input className="input" type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </label>
                    <label style={{ fontSize: '12px', width: '120px' }}>
                      Valid for (days)
                      <input className="input" type="number" min="1" max="30" step="1" value={validDays} onChange={(e) => setValidDays(e.target.value)} />
                    </label>
                  </div>
                  <label style={{ fontSize: '12px' }}>
                    Note to the customer
                    <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's included, materials, how long it takes" required />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: 'flex-start' }}>{busy ? 'Sending…' : 'Send quote'}</button>
                </form>
              )}

              {selected.status === 'QUOTE_ACCEPTED' && (
                <div style={{ fontSize: '13px', background: 'var(--ok-bg)', color: 'var(--ok)', padding: '10px 12px' }}>
                  Accepted — the order is in Bridal Orders (look for “From custom request”). Collect payment and update its status there.
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selected.status === 'QUOTE_ACCEPTED' && (
                  <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setStatus(selected, 'IN_PRODUCTION')}>Mark in production</button>
                )}
                {selected.status === 'IN_PRODUCTION' && (
                  <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setStatus(selected, 'COMPLETED')}>Mark completed</button>
                )}
                {selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                  <button type="button" disabled={busy} onClick={() => setStatus(selected, 'CANCELLED')} style={{ background: 'none', border: 0, color: 'var(--er)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                    Close request
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
