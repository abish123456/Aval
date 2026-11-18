'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PageHeader, Notice, useFlash, FlashMessage, adminRequest } from '../_components/ui'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', Number.isInteger(n) ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ---------------------------------------------------------------------------
// Image Gallery Manager Component
// ---------------------------------------------------------------------------
function ImageGalleryManager({
  images,
  onChange,
  onError,
}: {
  images: string[]
  onChange: (images: string[]) => void
  onError: (message: string) => void
}) {
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const makeMain = (index: number) => {
    if (index === 0) return
    const target = images[index]
    const others = images.filter((_, i) => i !== index)
    onChange([target, ...others])
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    onChange([...images, urlInput.trim()])
    setUrlInput('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.success && data.data?.url) {
        onChange([...images, data.data.url])
      } else {
        onError(data.error || 'Failed to upload image.')
      }
    } catch {
      onError('Network error while uploading image.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)' }}>
          Product Images ({images.length})
        </span>
        <span style={{ fontSize: '11px', color: 'var(--tx2)' }}>
          First image is the <strong>Main Cover Image</strong>
        </span>
      </div>

      {/* Thumbnails Row */}
      {images.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
          {images.map((img, idx) => {
            const isMain = idx === 0
            return (
              <div
                key={`${img}-${idx}`}
                style={{
                  position: 'relative',
                  border: isMain ? '2px solid var(--pr)' : '1px solid var(--bd)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#fafafa',
                  boxShadow: isMain ? '0 2px 8px rgba(122,16,38,0.15)' : 'none',
                }}
              >
                {/* Main Image Badge */}
                {isMain && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: 'var(--pr)',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      zIndex: 2,
                    }}
                  >
                    ★ Main
                  </div>
                )}

                <img
                  src={img}
                  alt={`Product ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '90px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    // Fallback thumbnail on broken image
                    (e.target as HTMLImageElement).src = '/images/kundan_set.jpg'
                  }}
                />

                {/* Actions Bar under image */}
                <div style={{ display: 'flex', borderTop: '1px solid var(--bd)', background: '#fff' }}>
                  {!isMain ? (
                    <button
                      type="button"
                      onClick={() => makeMain(idx)}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        borderRight: '1px solid var(--bd)',
                        padding: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--pr)',
                        cursor: 'pointer',
                      }}
                      title="Set as Main Cover Image"
                    >
                      Make Main
                    </button>
                  ) : (
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'var(--ok)', padding: '4px', fontWeight: 600 }}>
                      Cover
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: '#b91c1c',
                      cursor: 'pointer',
                    }}
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '6px', textAlign: 'center', color: 'var(--tx2)', fontSize: '12px' }}>
          No images added yet. Upload a photo or enter an image URL below.
        </div>
      )}

      {/* Add Image Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary"
          style={{ height: '36px', fontSize: '12px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Image from Device'}
        </button>

        {/* Or enter URL */}
        <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="input"
            placeholder="Or paste an image path, e.g. /uploads/photo.jpg"
            aria-label="Image path"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ height: '36px', fontSize: '12px', flex: 1 }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="btn btn-outline"
            style={{ height: '36px', fontSize: '12px', padding: '0 12px' }}
          >
            Add URL
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Admin Products Page
// ---------------------------------------------------------------------------

interface AdminProduct {
  id: string
  name: string
  slug: string
  categoryId: string
  categoryName: string
  regularPrice: number
  salePrice: number
  stock: number
  customisable: boolean
  isBestSeller: boolean
  isNew: boolean
  description: string
  details: string[]
  images: string[]
  sizes: string[]
  archived: boolean
}

interface CategoryOption {
  id: string
  name: string
  archived: boolean
}

interface FormState {
  id?: string
  name: string
  categoryId: string
  regularPrice: string
  salePrice: string
  stock: string
  customisable: boolean
  isBestSeller: boolean
  isNew: boolean
  description: string
  details: string
  sizes: string
  images: string[]
}

const EMPTY_FORM: FormState = {
  name: '',
  categoryId: '',
  regularPrice: '',
  salePrice: '',
  stock: '0',
  customisable: false,
  isBestSeller: false,
  isNew: true,
  description: '',
  details: '',
  sizes: '',
  images: [],
}

function toForm(p: AdminProduct): FormState {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    regularPrice: String(p.regularPrice),
    salePrice: String(p.salePrice),
    stock: String(p.stock),
    customisable: p.customisable,
    isBestSeller: p.isBestSeller,
    isNew: p.isNew,
    description: p.description,
    details: p.details.join('\n'),
    sizes: p.sizes.join(', '),
    images: p.images,
  }
}

/** Returns an error message, or null when the form is valid. */
function validate(f: FormState): string | null {
  if (f.name.trim().length < 2) return 'Enter a product name.'
  if (!f.categoryId) return 'Choose a category.'
  const regular = Number(f.regularPrice)
  const sale = Number(f.salePrice)
  if (!Number.isFinite(regular) || regular <= 0) return 'Enter the regular price in rupees.'
  if (!Number.isFinite(sale) || sale <= 0) return 'Enter the selling price in rupees.'
  if (sale > regular) return 'The selling price can’t be higher than the regular price.'
  if (!f.id && (!Number.isInteger(Number(f.stock)) || Number(f.stock) < 0)) return 'Stock must be a whole number, 0 or more.'
  if (f.images.length === 0) return 'Add at least one photo.'
  return null
}

const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--dk)', display: 'block', marginBottom: '6px' }

function ProductForm({
  form,
  setForm,
  categories,
  submitting,
  onSubmit,
  onCancel,
  onError,
}: {
  form: FormState
  setForm: (f: FormState) => void
  categories: CategoryOption[]
  submitting: boolean
  onSubmit: () => void
  onCancel: () => void
  onError: (m: string) => void
}) {
  const editing = !!form.id
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v })
  const regular = Number(form.regularPrice)
  const sale = Number(form.salePrice)
  const priceProblem = form.regularPrice && form.salePrice && sale > regular

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="product-form-title" style={{ position: 'fixed', inset: 0, background: 'rgba(58,21,32,0.45)', zIndex: 1500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '32px 16px' }}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit() }}
        className="card"
        style={{ background: '#fff', width: '100%', maxWidth: '720px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="product-form-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>
            {editing ? 'Edit product' : 'Add product'}
          </h2>
          <button type="button" onClick={onCancel} aria-label="Close" style={{ background: 'none', border: 0, fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div>
          <label htmlFor="pf-name" style={labelStyle}>Product name *</label>
          <input id="pf-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Royal Meenakshi Antique Kada" required />
        </div>

        <ImageGalleryManager images={form.images} onChange={(imgs) => set('images', imgs)} onError={onError} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div>
            <label htmlFor="pf-category" style={labelStyle}>Category *</label>
            <select id="pf-category" className="input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (hidden)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pf-regular" style={labelStyle}>Regular price (₹) *</label>
            <input id="pf-regular" className="input" type="number" min="1" step="1" inputMode="numeric" value={form.regularPrice} onChange={(e) => set('regularPrice', e.target.value)} required />
          </div>
          <div>
            <label htmlFor="pf-sale" style={labelStyle}>Selling price (₹) *</label>
            <input id="pf-sale" className="input" type="number" min="1" step="1" inputMode="numeric" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} required aria-invalid={!!priceProblem} aria-describedby="pf-sale-hint" />
            <div id="pf-sale-hint" style={{ fontSize: '11px', marginTop: '4px', color: priceProblem ? 'var(--er)' : 'var(--tx2)' }}>
              {priceProblem ? 'Must not be higher than the regular price' : regular > sale && sale > 0 ? `${Math.round(((regular - sale) / regular) * 100)}% off shown in store` : 'Same as regular = no discount'}
            </div>
          </div>
          <div>
            <label htmlFor="pf-stock" style={labelStyle}>{editing ? 'Stock' : 'Opening stock *'}</label>
            {editing ? (
              <div style={{ fontSize: '14px', padding: '10px 0' }}>
                {form.stock} units · <a href="/admin/inventory">change in Inventory</a>
              </div>
            ) : (
              <input id="pf-stock" className="input" type="number" min="0" step="1" inputMode="numeric" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
            )}
          </div>
        </div>

        <div>
          <label htmlFor="pf-sizes" style={labelStyle}>Sizes customers choose from</label>
          <input id="pf-sizes" className="input" value={form.sizes} onChange={(e) => set('sizes', e.target.value)} placeholder="e.g. 2.4, 2.6, 2.8 — leave empty for one size" />
        </div>

        <div>
          <label htmlFor="pf-desc" style={labelStyle}>Description</label>
          <textarea id="pf-desc" className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Materials, stones, finish and styling notes" />
        </div>

        <div>
          <label htmlFor="pf-details" style={labelStyle}>Specification bullets (one per line)</label>
          <textarea id="pf-details" className="input" rows={3} value={form.details} onChange={(e) => set('details', e.target.value)} placeholder={'Hand-set Kundan stones\nShips in velvet gift box'} />
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '13px' }}>
          <legend style={{ ...labelStyle, marginBottom: '8px' }}>Options</legend>
          <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="checkbox" checked={form.customisable} onChange={(e) => set('customisable', e.target.checked)} /> Offer name personalisation (+₹200)
          </label>
          <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="checkbox" checked={form.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} /> Best seller badge
          </label>
          <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} /> New arrival badge
          </label>
        </fieldset>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<AdminProduct | null>(null)
  const [flash, showFlash, clearFlash] = useFlash()
  const [nonce, setNonce] = useState(0)
  const reload = () => setNonce((n) => n + 1)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`/api/admin/products?pageSize=100&archived=${showArchived}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/admin/categories', { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([prod, cats]) => {
        if (cancelled) return
        if (!prod?.success) {
          setLoadError(typeof prod?.error === 'string' ? prod.error : 'Could not load products.')
          return
        }
        setLoadError(null)
        setProducts(
          (prod.data.data as Array<Record<string, unknown> & { category?: { id: string; name: string } }>).map((p) => ({
            id: p.id as string,
            name: p.name as string,
            slug: p.slug as string,
            categoryId: (p.categoryId as string) ?? p.category?.id ?? '',
            categoryName: p.category?.name ?? '',
            regularPrice: (p.regularPricePaise as number) / 100,
            salePrice: (p.salePricePaise as number) / 100,
            stock: p.stock as number,
            customisable: !!p.customisable,
            isBestSeller: !!p.isBestSeller,
            isNew: !!p.isNew,
            description: (p.description as string) ?? '',
            details: Array.isArray(p.details) ? (p.details as string[]) : [],
            images: Array.isArray(p.images) ? (p.images as string[]) : [],
            sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
            archived: !!p.archived,
          }))
        )
        if (cats?.success && Array.isArray(cats.data)) {
          setCategories(cats.data.map((c: CategoryOption) => ({ id: c.id, name: c.name, archived: c.archived })))
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the server.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [showArchived, nonce])

  async function save() {
    if (!form) return
    const problem = validate(form)
    if (problem) return showFlash('error', problem)
    setSubmitting(true)
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      regularPricePaise: Math.round(Number(form.regularPrice) * 100),
      salePricePaise: Math.round(Number(form.salePrice) * 100),
      customisable: form.customisable,
      isBestSeller: form.isBestSeller,
      isNew: form.isNew,
      description: form.description.trim(),
      details: form.details.split('\n').map((d) => d.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map((d) => d.trim()).filter(Boolean),
      images: form.images,
      ...(form.id ? {} : { stock: Number(form.stock) }),
    }
    const r = form.id
      ? await adminRequest(`/api/admin/products/${form.id}`, 'PATCH', payload)
      : await adminRequest('/api/admin/products', 'POST', payload)
    setSubmitting(false)
    if (!r.ok) return showFlash('error', r.error ?? 'Could not save the product.')
    showFlash('ok', form.id ? 'Product updated.' : 'Product added. It is now live in the store.')
    setForm(null)
    reload()
  }

  async function remove(p: AdminProduct) {
    setConfirmRemove(null)
    const r = await adminRequest<{ deleted?: boolean; archived?: boolean }>(`/api/admin/products/${p.id}`, 'DELETE')
    if (!r.ok) return showFlash('error', r.error ?? 'Could not remove the product.')
    showFlash(
      'ok',
      r.data?.archived
        ? `“${p.name}” has order or stock history, so it was hidden from the store instead of deleted. Find it under Hidden products.`
        : `“${p.name}” deleted.`
    )
    reload()
  }

  async function restore(p: AdminProduct) {
    const r = await adminRequest(`/api/admin/products/${p.id}`, 'PATCH', { archived: false })
    if (!r.ok) return showFlash('error', r.error ?? 'Could not restore the product.')
    showFlash('ok', `“${p.name}” is back in the store.`)
    reload()
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Photos, prices, sizes and badges for every design in the store"
        actions={
          <>
            <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px' }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => { setLoading(true); setShowArchived(e.target.checked) }} /> Show hidden products
            </label>
            <button type="button" className="btn btn-primary" onClick={() => setForm({ ...EMPTY_FORM, categoryId: categories.find((c) => !c.archived)?.id ?? '' })}>
              Add product
            </button>
          </>
        }
      />

      {loadError ? (
        <Notice kind="error">{loadError}</Notice>
      ) : loading ? (
        <Notice>Loading products…</Notice>
      ) : products.length === 0 ? (
        <Notice>{showArchived ? 'No hidden products.' : 'No products yet. Add your first design.'}</Notice>
      ) : (
        <div className="card" style={{ padding: '8px 16px', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th>Sizes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.images[0] ?? '/images/hero_bangles.jpg'} alt="" width={44} height={44} style={{ objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <a href={`/product/${p.slug}`} target="_blank" style={{ fontWeight: 600, color: 'var(--dk)' }}>{p.name}</a>
                        <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>
                          {p.images.length} photo{p.images.length === 1 ? '' : 's'}
                          {p.isBestSeller ? ' · Best seller' : ''}{p.isNew ? ' · New' : ''}{p.customisable ? ' · Personalisable' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{p.categoryName || '—'}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <strong>{fmt(p.salePrice)}</strong>
                    {p.regularPrice > p.salePrice && <div style={{ fontSize: '11px', color: 'var(--tx2)', textDecoration: 'line-through' }}>{fmt(p.regularPrice)}</div>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`tag ${p.stock === 0 ? 'tag-error' : p.stock < 10 ? 'tag-warning' : 'tag-ok'}`}>{p.stock}</span>
                  </td>
                  <td style={{ fontSize: '12px' }}>{p.sizes.length ? p.sizes.join(', ') : 'One size'}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {p.archived ? (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => restore(p)}>Show in store</button>
                    ) : (
                      <>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm(toForm(p))}>Edit</button>{' '}
                        <button type="button" onClick={() => setConfirmRemove(p)} style={{ background: 'none', border: 0, color: 'var(--er)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmRemove && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="remove-title" style={{ position: 'fixed', inset: 0, background: 'rgba(58,21,32,0.45)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ background: '#fff', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 id="remove-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: 0, color: 'var(--dk)' }}>Remove “{confirmRemove.name}”?</h2>
            <p style={{ fontSize: '14px', color: 'var(--tx2)', margin: 0 }}>
              It disappears from the store straight away. If it has ever been ordered or had stock changes, it is hidden rather than deleted so your records stay intact, and you can bring it back later.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setConfirmRemove(null)}>Keep it</button>
              <button type="button" className="btn btn-primary" onClick={() => remove(confirmRemove)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {form && (
        <ProductForm
          form={form}
          setForm={setForm}
          categories={categories}
          submitting={submitting}
          onSubmit={save}
          onCancel={() => setForm(null)}
          onError={(m) => showFlash('error', m)}
        />
      )}

      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
