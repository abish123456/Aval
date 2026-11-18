'use client'

import { useState } from 'react'
import { PageHeader, Notice, useAdminData, useFlash, FlashMessage, adminRequest, formatDate } from '../_components/ui'

interface Review {
  id: string
  rating: number
  body: string
  guestName: string | null
  verifiedPurchase: boolean
  visible: boolean
  artisanReply: string | null
  createdAt: string
  product: { id: string; name: string; slug: string }
  user: { name: string } | null
}

const FILTERS = [
  { key: 'pending', label: 'Waiting for approval', match: (r: Review) => !r.visible },
  { key: 'visible', label: 'Shown in store', match: (r: Review) => r.visible },
  { key: 'all', label: 'All', match: () => true },
] as const

export default function AdminReviewsPage() {
  const { data, error, loading, reload } = useAdminData<Review[]>('/api/admin/reviews')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('pending')
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, showFlash, clearFlash] = useFlash()

  const all = data ?? []
  const rows = all.filter(FILTERS.find((f) => f.key === filter)!.match)
  const shown = all.filter((r) => r.visible)
  const avg = shown.length ? shown.reduce((s, r) => s + r.rating, 0) / shown.length : 0

  async function patch(r: Review, body: { visible?: boolean; artisanReply?: string }, ok: string) {
    setBusy(r.id)
    const res = await adminRequest('/api/admin/reviews', 'PATCH', { id: r.id, ...body })
    setBusy(null)
    if (!res.ok) return showFlash('error', res.error ?? 'Not saved.')
    showFlash('ok', ok)
    reload()
  }

  async function remove(r: Review) {
    setConfirmDelete(null)
    setBusy(r.id)
    const res = await adminRequest(`/api/admin/reviews?id=${encodeURIComponent(r.id)}`, 'DELETE')
    setBusy(null)
    if (!res.ok) return showFlash('error', res.error ?? 'Not deleted.')
    showFlash('ok', 'Review deleted.')
    reload()
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="Customers review automatically when they rate a delivered order. Approve a review to show it on the product page; only approved reviews count towards the star rating."
      />

      {data && (
        <p style={{ fontSize: '14px', marginTop: '-12px', marginBottom: '16px' }}>
          {shown.length > 0 ? <>Store average <strong>{avg.toFixed(1)} ★</strong> from {shown.length} approved review{shown.length === 1 ? '' : 's'}.</> : 'No approved reviews yet.'}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f.key)}>
            {f.label} ({all.filter(f.match).length})
          </button>
        ))}
      </div>

      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : loading && !data ? (
        <Notice>Loading reviews…</Notice>
      ) : rows.length === 0 ? (
        <Notice>{all.length === 0 ? 'No reviews yet. They arrive when customers rate their delivered orders.' : 'Nothing in this view.'}</Notice>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rows.map((r) => {
            const draft = replies[r.id] ?? r.artisanReply ?? ''
            return (
              <article key={r.id} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <a href={`/product/${r.product.slug}#reviews`} target="_blank" style={{ fontWeight: 600 }}>{r.product.name}</a>
                    <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                      {r.user?.name ?? r.guestName ?? 'Customer'} · {formatDate(r.createdAt)}{r.verifiedPurchase ? ' · Verified purchase' : ' · Not verified'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#D97706' }} aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span className={`tag ${r.visible ? 'tag-ok' : 'tag-warning'}`}>{r.visible ? 'Shown' : 'Waiting'}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: r.body ? 'var(--tx)' : 'var(--tx2)' }}>{r.body || 'Star rating only, no comment.'}</p>

                <div>
                  <label htmlFor={`reply-${r.id}`} style={{ fontSize: '12px', fontWeight: 600 }}>Your public reply</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <input id={`reply-${r.id}`} className="input" value={draft} maxLength={1000} onChange={(e) => setReplies((m) => ({ ...m, [r.id]: e.target.value }))} placeholder="Thank the customer or answer their point" style={{ flex: '1 1 240px', minWidth: 0 }} />
                    <button type="button" className="btn btn-outline btn-sm" disabled={busy === r.id || draft === (r.artisanReply ?? '')} onClick={() => patch(r, { artisanReply: draft }, draft ? 'Reply saved.' : 'Reply removed.')}>
                      Save reply
                    </button>
                  </div>
                  {r.artisanReply && !r.visible && <div style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '4px' }}>The reply appears in the store once the review is approved.</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {r.visible ? (
                    <button type="button" className="btn btn-outline btn-sm" disabled={busy === r.id} onClick={() => patch(r, { visible: false }, 'Review hidden from the store.')}>Hide from store</button>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => patch(r, { visible: true }, 'Review approved and shown in the store.')}>Approve</button>
                  )}
                  {confirmDelete === r.id ? (
                    <>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => remove(r)}>Yes, delete</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Keep</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmDelete(r.id)} style={{ background: 'none', border: 0, color: 'var(--er)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
