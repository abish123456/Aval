'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { PageHeader, Notice, useAdminData, useFlash, FlashMessage, adminRequest } from '../_components/ui'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
  productCount: number
  archived: boolean
  sortOrder: number
}

interface FormState {
  id?: string
  name: string
  description: string
  image: string
  sortOrder: string
  visible: boolean
}

const EMPTY: FormState = { name: '', description: '', image: '/images/hero_bangles.jpg', sortOrder: '0', visible: true }

const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--dk)', display: 'block', marginBottom: '6px' }

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminCategoriesPage() {
  const { data, error, loading, reload } = useAdminData<Category[]>('/api/admin/categories')
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null)
  const [flash, showFlash, clearFlash] = useFlash()
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.data?.url) setForm((f) => (f ? { ...f, image: json.data.url } : f))
      else showFlash('error', json?.error ?? 'Upload failed.')
    } catch {
      showFlash('error', 'Upload failed. Check your connection.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save() {
    if (!form) return
    if (form.name.trim().length < 2) return showFlash('error', 'Enter a category name.')
    const sort = Number(form.sortOrder)
    if (!Number.isInteger(sort) || sort < 0) return showFlash('error', 'Order must be a whole number, 0 or more.')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim() || '/images/hero_bangles.jpg',
      sortOrder: sort,
    }
    const r = form.id
      ? await adminRequest(`/api/admin/categories/${form.id}`, 'PATCH', { ...payload, archived: !form.visible })
      : await adminRequest('/api/admin/categories', 'POST', { ...payload, slug: slugify(form.name) })
    setSaving(false)
    if (!r.ok) return showFlash('error', r.error ?? 'Could not save the category.')
    showFlash('ok', form.id ? 'Category updated.' : 'Category created.')
    setForm(null)
    reload()
  }

  async function remove(c: Category) {
    setConfirmDelete(null)
    const r = await adminRequest(`/api/admin/categories/${c.id}`, 'DELETE')
    if (!r.ok) return showFlash('error', r.error ?? 'Could not delete the category.')
    showFlash('ok', `“${c.name}” deleted.`)
    reload()
  }

  const rows = data ?? []

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Collections shown in the store menu, home page and footer. Lower order numbers appear first; empty or hidden categories are not shown to customers."
        actions={<button type="button" className="btn btn-primary" onClick={() => setForm({ ...EMPTY, sortOrder: String(rows.length) })}>Add category</button>}
      />

      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : loading && !data ? (
        <Notice>Loading categories…</Notice>
      ) : rows.length === 0 ? (
        <Notice>No categories yet.</Notice>
      ) : (
        <div className="card" style={{ padding: '8px 16px', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Products</th>
                <th>In store</th>
                <th style={{ textAlign: 'right' }}>Order</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt="" width={40} height={40} style={{ objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <Link href={`/category/${c.slug}`} target="_blank" style={{ fontSize: '11px' }}>/category/{c.slug}</Link>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{c.productCount}</td>
                  <td>
                    {c.archived ? (
                      <span className="tag tag-error">Hidden</span>
                    ) : c.productCount === 0 ? (
                      <span className="tag tag-warning" title="Categories without products are not shown to customers">Hidden (empty)</span>
                    ) : (
                      <span className="tag tag-ok">Shown</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>{c.sortOrder}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setForm({ id: c.id, name: c.name, description: c.description, image: c.image, sortOrder: String(c.sortOrder), visible: !c.archived })}
                    >
                      Edit
                    </button>{' '}
                    <button type="button" onClick={() => setConfirmDelete(c)} style={{ background: 'none', border: 0, color: 'var(--er)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div role="dialog" aria-modal="true" aria-labelledby="cat-form-title" style={{ position: 'fixed', inset: 0, background: 'rgba(58,21,32,0.45)', zIndex: 1500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '32px 16px' }}>
          <form onSubmit={(e) => { e.preventDefault(); save() }} className="card" style={{ background: '#fff', width: '100%', maxWidth: '560px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 id="cat-form-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>
              {form.id ? 'Edit category' : 'Add category'}
            </h2>
            <div>
              <label htmlFor="cf-name" style={labelStyle}>Name *</label>
              <input id="cf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {!form.id && form.name && <div style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '4px' }}>Address: /category/{slugify(form.name)}</div>}
            </div>
            <div>
              <label htmlFor="cf-desc" style={labelStyle}>Description</label>
              <textarea id="cf-desc" className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Shown at the top of the category page" />
            </div>
            <div>
              <span style={labelStyle}>Cover image</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image || '/images/hero_bangles.jpg'} alt="" width={64} height={64} style={{ objectFit: 'cover', borderRadius: '4px' }} />
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <button type="button" className="btn btn-outline btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : 'Upload photo'}</button>
                <input className="input" aria-label="Image path" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} style={{ flex: '1 1 180px', minWidth: 0 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label htmlFor="cf-order" style={labelStyle}>Order</label>
                <input id="cf-order" className="input" type="number" min="0" step="1" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} style={{ width: '100px' }} />
              </div>
              {form.id && (
                <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px', paddingBottom: '10px' }}>
                  <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> Show in store
                </label>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save changes' : 'Create category'}</button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="cat-del-title" style={{ position: 'fixed', inset: 0, background: 'rgba(58,21,32,0.45)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ background: '#fff', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 id="cat-del-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: 0, color: 'var(--dk)' }}>Delete “{confirmDelete.name}”?</h2>
            <p style={{ fontSize: '14px', color: 'var(--tx2)', margin: 0 }}>
              {confirmDelete.productCount > 0
                ? `It still has ${confirmDelete.productCount} product(s), so it can't be deleted. Move them first or hide the category instead.`
                : 'This can’t be undone.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              {confirmDelete.productCount === 0 && <button type="button" className="btn btn-primary" onClick={() => remove(confirmDelete)}>Delete</button>}
            </div>
          </div>
        </div>
      )}

      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
