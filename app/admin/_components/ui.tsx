'use client'

import React, { useEffect, useState } from 'react'

// Shared bits for admin pages that show live data.

export function rupees(paise: number): string {
  return '₹' + Math.round(paise / 100).toLocaleString('en-IN')
}

export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const STATUS_LABEL: Record<string, string> = {
  ENQUIRY: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  MAKING: 'Handcrafting',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const STATUS_CLASS: Record<string, string> = {
  ENQUIRY: 'tag-warning',
  CONFIRMED: 'tag-blush',
  MAKING: 'tag-blush',
  DISPATCHED: 'tag-primary',
  DELIVERED: 'tag-ok',
  CANCELLED: 'tag-error',
}

export function StatusTag({ status }: { status: string }) {
  return <span className={`tag ${STATUS_CLASS[status] ?? ''}`}>{STATUS_LABEL[status] ?? status}</span>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--dk)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '13px', color: 'var(--tx2)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: '12px', color: 'var(--tx2)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--dk)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {hint && <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>{children}</div>
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error'; children: React.ReactNode }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className="card"
      style={{ padding: '28px', textAlign: 'center', color: kind === 'error' ? 'var(--er)' : 'var(--tx2)', fontSize: '14px' }}
    >
      {children}
    </div>
  )
}

/** Fetch `{ success, data }` from an admin API; reports loading and errors honestly. */
export function useAdminData<T>(url: string): { data: T | null; error: string | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(url, { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (cancelled) return
        if (r.ok && body?.success) {
          setData(body.data as T)
          setError(null)
        } else {
          setError(typeof body?.error === 'string' ? body.error : `Could not load data (HTTP ${r.status}).`)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the server.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [url, nonce])

  return { data, error, loading, reload: () => setNonce((n) => n + 1) }
}

// ---------------------------------------------------------------------------
// Inline status messages (replaces alert()). Errors stay until dismissed.
// ---------------------------------------------------------------------------

export interface Flash {
  kind: 'ok' | 'error'
  text: string
}

export function useFlash(): [Flash | null, (kind: Flash['kind'], text: string) => void, () => void] {
  const [flash, setFlash] = useState<Flash | null>(null)
  useEffect(() => {
    if (flash?.kind !== 'ok') return
    const t = setTimeout(() => setFlash(null), 3500)
    return () => clearTimeout(t)
  }, [flash])
  return [flash, (kind, text) => setFlash({ kind, text }), () => setFlash(null)]
}

export function FlashMessage({ flash, onClose }: { flash: Flash | null; onClose: () => void }) {
  if (!flash) return null
  const error = flash.kind === 'error'
  return (
    <div
      role={error ? 'alert' : 'status'}
      style={{
        position: 'fixed',
        right: 'max(16px, env(safe-area-inset-right, 0px))',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        zIndex: 2000,
        maxWidth: 'min(420px, calc(100vw - 32px))',
        background: error ? 'var(--er-bg, #fbe9e7)' : 'var(--dk)',
        color: error ? 'var(--er, #7A1026)' : '#fff',
        border: error ? '1px solid var(--er, #7A1026)' : 'none',
        padding: '12px 16px',
        borderRadius: '6px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        fontSize: '14px',
      }}
    >
      <span style={{ flex: 1 }}>{flash.text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss message" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>
        ✕
      </button>
    </div>
  )
}

/** POST/PATCH/DELETE helper: returns { ok, data, error } and never throws. */
export async function adminRequest<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json?.success !== false) return { ok: true, data: (json?.data ?? json) as T }
    return { ok: false, error: typeof json?.error === 'string' ? json.error : `Request failed (HTTP ${res.status})` }
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' }
  }
}
