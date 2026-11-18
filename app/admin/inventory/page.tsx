'use client'

import { useState } from 'react'
import { PageHeader, Notice, useAdminData, useFlash, FlashMessage, adminRequest } from '../_components/ui'

interface Row {
  id: string
  name: string
  stock: number
  category?: { name?: string }
}

const LOW_STOCK = 5

const REASONS = [
  { value: 'RESTOCK', label: 'New stock made' },
  { value: 'ADJUSTMENT', label: 'Count correction' },
  { value: 'DAMAGED', label: 'Damaged / lost' },
  { value: 'RETURN', label: 'Customer return' },
] as const

type Reason = (typeof REASONS)[number]['value']

export default function AdminInventoryPage() {
  const { data, error, loading, reload } = useAdminData<{ data: Row[] }>('/api/admin/products?pageSize=100')
  const [drafts, setDrafts] = useState<Record<string, { delta: string; reason: Reason; note: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [flash, showFlash, clearFlash] = useFlash()

  const draft = (id: string) => drafts[id] ?? { delta: '', reason: 'RESTOCK' as Reason, note: '' }
  const setDraft = (id: string, patch: Partial<{ delta: string; reason: Reason; note: string }>) =>
    setDrafts((d) => ({ ...d, [id]: { ...draft(id), ...patch } }))

  async function apply(row: Row, delta: number, reason: Reason, note?: string) {
    if (!Number.isInteger(delta) || delta === 0) return showFlash('error', 'Enter a whole number, e.g. 5 to add or -2 to remove.')
    setSavingId(row.id)
    const r = await adminRequest<{ stock: number }>('/api/admin/inventory/adjust', 'POST', { productId: row.id, delta, reason, note: note?.trim() || undefined })
    setSavingId(null)
    if (!r.ok) return showFlash('error', r.error ?? 'Stock not changed.')
    showFlash('ok', `${row.name}: stock is now ${r.data?.stock}.`)
    setDrafts((d) => {
      const next = { ...d }
      delete next[row.id]
      return next
    })
    reload()
  }

  const rows = data?.data ?? []

  return (
    <div>
      <PageHeader title="Inventory" subtitle={`Every change is logged with a reason. Items at ${LOW_STOCK} or fewer are flagged low.`} />

      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : loading && !data ? (
        <Notice>Loading stock…</Notice>
      ) : rows.length === 0 ? (
        <Notice>No products yet.</Notice>
      ) : (
        <div className="card" style={{ padding: '8px 16px', overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '760px' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'right' }}>In stock</th>
                <th>Adjust</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const d = draft(row.id)
                const busy = savingId === row.id
                return (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>{row.category?.name ?? ''}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`tag ${row.stock === 0 ? 'tag-error' : row.stock <= LOW_STOCK ? 'tag-warning' : 'tag-ok'}`}>
                        {row.stock === 0 ? 'Sold out' : `${row.stock}${row.stock <= LOW_STOCK ? ' · low' : ''}`}
                      </span>
                    </td>
                    <td>
                      <form
                        onSubmit={(e) => { e.preventDefault(); apply(row, Number(d.delta), d.reason, d.note) }}
                        style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}
                      >
                        <label htmlFor={`delta-${row.id}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Change for {row.name}</label>
                        <input
                          id={`delta-${row.id}`}
                          className="input"
                          type="number"
                          step="1"
                          inputMode="numeric"
                          placeholder="+5 or -2"
                          value={d.delta}
                          onChange={(e) => setDraft(row.id, { delta: e.target.value })}
                          style={{ width: '96px', height: '34px' }}
                        />
                        <label htmlFor={`reason-${row.id}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Reason</label>
                        <select id={`reason-${row.id}`} className="input" value={d.reason} onChange={(e) => setDraft(row.id, { reason: e.target.value as Reason })} style={{ width: 'auto', height: '34px' }}>
                          {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <input
                          className="input"
                          aria-label="Note (optional)"
                          placeholder="Note (optional)"
                          value={d.note}
                          onChange={(e) => setDraft(row.id, { note: e.target.value })}
                          style={{ width: '150px', height: '34px' }}
                        />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !d.delta}>
                          {busy ? 'Saving…' : 'Apply'}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => apply(row, 5, 'RESTOCK', 'Quick restock')}>+5</button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
