'use client'

import React, { useState } from 'react'
import { PageHeader, Notice, useAdminData, useFlash, FlashMessage, adminRequest, rupees, formatDate } from '../_components/ui'

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: 'PERCENT' | 'FIXED' | 'BUNDLE_PRICE'
  valueBp: number
  minSpendPaise: number
  usageLimit: number | null
  perCustomerLimit: number
  startsAt: string | null
  expiresAt: string | null
  active: boolean
  used: number
  discountGivenPaise: number
}

interface FormState {
  id?: string
  code: string
  description: string
  discountType: 'PERCENT' | 'FIXED'
  value: string
  minSpend: string
  limited: boolean
  usageLimit: string
  perCustomerLimit: string
  startsAt: string
  expiresAt: string
  active: boolean
}

const EMPTY: FormState = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  value: '10',
  minSpend: '0',
  limited: false,
  usageLimit: '100',
  perCustomerLimit: '1',
  startsAt: '',
  expiresAt: '',
  active: true,
}

const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--dk)', display: 'block', marginBottom: '6px' }

/** yyyy-mm-dd for <input type="date"> */
const dayValue = (iso: string | null) => (iso ? iso.slice(0, 10) : '')

function headline(c: Coupon) {
  return c.discountType === 'PERCENT' ? `${c.valueBp / 100}% off` : `${rupees(c.valueBp)} off`
}

function state(c: Coupon): { label: string; cls: string } {
  const now = Date.now()
  if (!c.active) return { label: 'Off', cls: 'tag-error' }
  if (c.expiresAt && Date.parse(c.expiresAt) < now) return { label: 'Expired', cls: 'tag-error' }
  if (c.startsAt && Date.parse(c.startsAt) > now) return { label: 'Scheduled', cls: 'tag-warning' }
  if (c.usageLimit !== null && c.used >= c.usageLimit) return { label: 'Used up', cls: 'tag-error' }
  return { label: 'Live', cls: 'tag-ok' }
}

export default function AdminCouponsPage() {
  const { data, error, loading, reload } = useAdminData<Coupon[]>('/api/admin/promotions')
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [flash, showFlash, clearFlash] = useFlash()

  function toForm(c: Coupon): FormState {
    return {
      id: c.id,
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
      value: String(c.discountType === 'PERCENT' ? c.valueBp / 100 : c.valueBp / 100),
      minSpend: String(c.minSpendPaise / 100),
      limited: c.usageLimit !== null,
      usageLimit: String(c.usageLimit ?? 100),
      perCustomerLimit: String(c.perCustomerLimit),
      startsAt: dayValue(c.startsAt),
      expiresAt: dayValue(c.expiresAt),
      active: c.active,
    }
  }

  async function save() {
    if (!form) return
    const value = Number(form.value)
    if (!Number.isFinite(value) || value <= 0) return showFlash('error', 'Enter the discount amount.')
    if (form.discountType === 'PERCENT' && (value < 1 || value > 90)) return showFlash('error', 'A percentage discount must be between 1% and 90%.')
    const payload = {
      description: form.description.trim(),
      discountType: form.discountType,
      valueBp: Math.round(value * 100), // % → basis points, ₹ → paise
      minSpendPaise: Math.round((Number(form.minSpend) || 0) * 100),
      usageLimit: form.limited ? Math.max(1, Math.round(Number(form.usageLimit) || 1)) : null,
      perCustomerLimit: Math.max(1, Math.round(Number(form.perCustomerLimit) || 1)),
      // Start at the beginning of the start day, end at the end of the end day (IST)
      startsAt: form.startsAt ? `${form.startsAt}T00:00:00+05:30` : null,
      expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59+05:30` : null,
      active: form.active,
    }
    setSaving(true)
    const r = form.id
      ? await adminRequest(`/api/admin/promotions/${form.id}`, 'PATCH', payload)
      : await adminRequest('/api/admin/promotions', 'POST', { ...payload, code: form.code.trim().toUpperCase() })
    setSaving(false)
    if (!r.ok) return showFlash('error', r.error ?? 'Could not save the coupon.')
    showFlash('ok', form.id ? 'Coupon updated.' : `Coupon ${form.code.toUpperCase()} created.`)
    setForm(null)
    reload()
  }

  async function toggle(c: Coupon) {
    const r = await adminRequest(`/api/admin/promotions/${c.id}`, 'PATCH', { active: !c.active })
    if (!r.ok) return showFlash('error', r.error ?? 'Could not change the coupon.')
    showFlash('ok', `${c.code} switched ${c.active ? 'off' : 'on'}.`)
    reload()
  }

  async function remove(c: Coupon) {
    const r = await adminRequest(`/api/admin/promotions/${c.id}`, 'DELETE')
    if (!r.ok) return showFlash('error', r.error ?? 'Could not delete the coupon.')
    showFlash('ok', `${c.code} deleted.`)
    reload()
  }

  const rows = data ?? []

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Codes customers enter in their bag. Unlimited-use coupons are also advertised on the Offers page and the top banner; limited ones stay private."
        actions={<button type="button" className="btn btn-primary" onClick={() => setForm({ ...EMPTY })}>New coupon</button>}
      />

      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : loading && !data ? (
        <Notice>Loading coupons…</Notice>
      ) : rows.length === 0 ? (
        <Notice>No coupons yet. Create one to offer a discount.</Notice>
      ) : (
        <div className="card" style={{ padding: '8px 16px', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th style={{ textAlign: 'right' }}>Used</th>
                <th style={{ textAlign: 'right' }}>Given</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const st = state(c)
                return (
                  <tr key={c.id}>
                    <td>
                      <code style={{ fontWeight: 700, color: 'var(--pr)' }}>{c.code}</code>
                      {c.description && <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>{c.description}</div>}
                    </td>
                    <td>{headline(c)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                      {c.minSpendPaise > 0 ? `Min ${rupees(c.minSpendPaise)} · ` : ''}
                      {c.perCustomerLimit === 1 ? 'Once per customer' : `${c.perCustomerLimit}× per customer`}
                      {c.usageLimit === null ? ' · Public' : ' · Private'}
                      <br />
                      {c.startsAt ? `From ${formatDate(c.startsAt)}` : 'From now'}{c.expiresAt ? ` to ${formatDate(c.expiresAt)}` : ', no end date'}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.used}{c.usageLimit !== null ? ` / ${c.usageLimit}` : ''}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rupees(c.discountGivenPaise)}</td>
                    <td><span className={`tag ${st.cls}`}>{st.label}</span></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm(toForm(c))}>Edit</button>{' '}
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => toggle(c)}>{c.active ? 'Switch off' : 'Switch on'}</button>
                      {c.used === 0 && (
                        <>
                          {' '}
                          <button type="button" onClick={() => remove(c)} style={{ background: 'none', border: 0, color: 'var(--er)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div role="dialog" aria-modal="true" aria-labelledby="coupon-form-title" style={{ position: 'fixed', inset: 0, background: 'rgba(58,21,32,0.45)', zIndex: 1500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '32px 16px' }}>
          <form onSubmit={(e) => { e.preventDefault(); save() }} className="card" style={{ background: '#fff', width: '100%', maxWidth: '560px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 id="coupon-form-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>
              {form.id ? `Edit ${form.code}` : 'New coupon'}
            </h2>

            {!form.id && (
              <div>
                <label htmlFor="cp-code" style={labelStyle}>Code *</label>
                <input id="cp-code" className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="e.g. WED10" maxLength={20} required style={{ textTransform: 'uppercase' }} />
              </div>
            )}

            <div>
              <label htmlFor="cp-desc" style={labelStyle}>Description shown to customers</label>
              <input id="cp-desc" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. 10% off for wedding season" maxLength={200} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div>
                <label htmlFor="cp-type" style={labelStyle}>Discount type</label>
                <select id="cp-type" className="input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as FormState['discountType'] })}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed amount (₹)</option>
                </select>
              </div>
              <div>
                <label htmlFor="cp-value" style={labelStyle}>{form.discountType === 'PERCENT' ? 'Percent off *' : 'Rupees off *'}</label>
                <input id="cp-value" className="input" type="number" min="1" step="1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
              </div>
              <div>
                <label htmlFor="cp-min" style={labelStyle}>Minimum order (₹)</label>
                <input id="cp-min" className="input" type="number" min="0" step="1" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: e.target.value })} />
              </div>
              <div>
                <label htmlFor="cp-per" style={labelStyle}>Uses per customer</label>
                <input id="cp-per" className="input" type="number" min="1" step="1" value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} />
              </div>
              <div>
                <label htmlFor="cp-start" style={labelStyle}>Starts</label>
                <input id="cp-start" className="input" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div>
                <label htmlFor="cp-end" style={labelStyle}>Ends</label>
                <input id="cp-end" className="input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>

            <fieldset style={{ border: '1px solid var(--bd)', borderRadius: '4px', padding: '12px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <legend style={{ ...labelStyle, padding: '0 4px', marginBottom: 0 }}>Who can use it</legend>
              <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input type="radio" name="cp-limit" checked={!form.limited} onChange={() => setForm({ ...form, limited: false })} /> Everyone, no total limit (advertised on the Offers page)
              </label>
              <label style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="radio" name="cp-limit" checked={form.limited} onChange={() => setForm({ ...form, limited: true })} /> Private, first
                <input aria-label="Total uses" className="input" type="number" min="1" step="1" value={form.usageLimit} disabled={!form.limited} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} style={{ width: '90px', height: '32px' }} />
                uses only
              </label>
            </fieldset>

            <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Switched on
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save changes' : 'Create coupon'}</button>
            </div>
          </form>
        </div>
      )}

      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
