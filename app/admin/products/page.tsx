'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Product } from '@/lib/data'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

// ---------------------------------------------------------------------------
// Image Gallery Manager Component
// ---------------------------------------------------------------------------
function ImageGalleryManager({
  images,
  onChange,
}: {
  images: string[]
  onChange: (images: string[]) => void
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
        alert(data.error || 'Failed to upload image.')
      }
    } catch {
      alert('Network error while uploading image.')
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
          accept="image/*"
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
            placeholder="Or enter image path: /images/hero_bangles.jpg"
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
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Bridal Bangles',
    categorySlug: 'bridal-bangles',
    regularPrice: 1999,
    salePrice: 1599,
    stock: 20,
    customisable: true,
    description: '',
    images: ['/images/hero_bangles.jpg'],
  })

  // Load from MySQL
  const loadProducts = () => {
    setLoading(true)
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data?.data)) {
          setProducts(
            res.data.data.map((p: {
              id: string
              name: string
              slug: string
              regularPricePaise: number
              salePricePaise: number
              stock: number
              customisable: boolean
              rating: number
              reviewCount: number
              description: string
              details?: string[]
              images?: string[]
              sizes?: string[]
              category?: { name: string; slug: string }
            }) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              category: p.category?.name ?? 'Bridal Bangles',
              categorySlug: p.category?.slug ?? 'bridal-bangles',
              regularPrice: p.regularPricePaise / 100,
              salePrice: p.salePricePaise / 100,
              discountPercent: Math.round(((p.regularPricePaise - p.salePricePaise) / p.regularPricePaise) * 100),
              rating: p.rating || 5.0,
              reviewCount: p.reviewCount || 0,
              customisable: p.customisable,
              stock: p.stock,
              description: p.description || '',
              details: Array.isArray(p.details) ? p.details : ['Handcrafted bridal accessory'],
              images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['/images/kundan_set.jpg'],
              sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['2.4', '2.6', '2.8'],
            }))
          )
        }
      })
      .catch((err) => console.error('Error loading products', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // CREATE
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const slug = newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          slug,
          categoryId: newProduct.categorySlug === 'hair-clips' ? 'cat-2' : newProduct.categorySlug === 'customised' ? 'cat-3' : 'cat-1',
          regularPricePaise: Math.round(Number(newProduct.regularPrice) * 100),
          salePricePaise: Math.round(Number(newProduct.salePrice) * 100),
          stock: Number(newProduct.stock),
          customisable: newProduct.customisable,
          description: newProduct.description || 'Handcrafted bridal accessory made in Kanyakumari.',
          details: ['Handmade silk thread wrapped', 'Available in standard Indian sizes'],
          images: newProduct.images.length > 0 ? newProduct.images : ['/images/kundan_set.jpg'],
          sizes: ['2.4', '2.6', '2.8'],
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setShowAddModal(false)
        setNewProduct({
          name: '',
          category: 'Bridal Bangles',
          categorySlug: 'bridal-bangles',
          regularPrice: 1999,
          salePrice: 1599,
          stock: 20,
          customisable: true,
          description: '',
          images: ['/images/hero_bangles.jpg'],
        })
        loadProducts()
        alert('Product added and published successfully!')
      } else {
        alert(data.error || 'Failed to save product to database.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error while saving product.')
    } finally {
      setSubmitting(false)
    }
  }

  // UPDATE
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          regularPricePaise: Math.round(Number(editingProduct.regularPrice) * 100),
          salePricePaise: Math.round(Number(editingProduct.salePrice) * 100),
          stock: Number(editingProduct.stock),
          customisable: editingProduct.customisable,
          description: editingProduct.description,
          images: editingProduct.images,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setEditingProduct(null)
        loadProducts()
        alert('Product updated successfully!')
      } else {
        alert(data.error || 'Failed to update product.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error while updating product.')
    } finally {
      setSubmitting(false)
    }
  }

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product from the database?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id))
        alert('Product deleted successfully!')
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id))
      }
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', margin: 0, fontWeight: 600 }}>
            Product Catalogue &amp; Media
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
            Manage handcrafted designs, multiple gallery photos, and set primary cover images.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Bridal Design
        </button>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>Loading catalogue...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>No products found in catalogue.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
                  <th style={{ padding: '12px 14px' }}>Main Image &amp; Product</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Sale Price</th>
                  <th style={{ padding: '12px 14px' }}>Stock</th>
                  <th style={{ padding: '12px 14px' }}>Photos</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F0E8E6' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--bd)', flexShrink: 0 }}>
                          <img
                            src={p.images?.[0] || '/images/kundan_set.jpg'}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--dk)' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--tx2)', fontFamily: 'monospace' }}>slug: {p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--tx2)' }}>{p.category}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--pr)' }}>{fmt(p.salePrice)}</span>{' '}
                      <span style={{ textDecoration: 'line-through', color: 'var(--tx2)', fontSize: '11px', marginLeft: '4px' }}>
                        {fmt(p.regularPrice)}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: p.stock < 10 ? '#fbe8c8' : '#dcefe1',
                          color: p.stock < 10 ? 'var(--wn)' : 'var(--ok)',
                        }}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                        {p.images?.length ?? 1} {p.images?.length === 1 ? 'photo' : 'photos'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          onClick={() => setEditingProduct({ ...p })}
                          style={{
                            background: 'var(--bl2)',
                            color: 'var(--pr)',
                            border: '1px solid var(--bd)',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Edit &amp; Photos
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '600px',
              background: '#fff',
              padding: '32px',
              borderRadius: '8px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>
                Add New Bridal Design
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <label className="input-label" style={{ fontSize: '13px' }}>
                Product Title *
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Royal Meenakshi Antique Kada"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </label>

              {/* Image Manager in Add Modal */}
              <div style={{ background: '#faf8f6', padding: '16px', borderRadius: '6px', border: '1px solid var(--bd)' }}>
                <ImageGalleryManager
                  images={newProduct.images}
                  onChange={(imgs) => setNewProduct({ ...newProduct, images: imgs })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                <label className="input-label" style={{ fontSize: '13px' }}>
                  Category
                  <select
                    className="input"
                    value={newProduct.category}
                    onChange={(e) => {
                      const cat = e.target.value
                      const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      setNewProduct({ ...newProduct, category: cat, categorySlug: slug })
                    }}
                  >
                    <option>Bridal Bangles</option>
                    <option>Hair Clips &amp; Pins</option>
                    <option>Customised Name Sets</option>
                    <option>Bridesmaid Favours</option>
                  </select>
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Initial Stock Count
                  <input
                    type="number"
                    required
                    className="input"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                <label className="input-label" style={{ fontSize: '13px' }}>
                  Regular Price (₹) *
                  <input
                    type="number"
                    required
                    className="input"
                    value={newProduct.regularPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, regularPrice: Number(e.target.value) })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Sale Price (₹) *
                  <input
                    type="number"
                    required
                    className="input"
                    value={newProduct.salePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, salePrice: Number(e.target.value) })}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newProduct.customisable}
                  onChange={(e) => setNewProduct({ ...newProduct, customisable: e.target.checked })}
                />
                Allow Name &amp; Date Personalisation (+₹200)
              </label>

              <label className="input-label" style={{ fontSize: '13px' }}>
                Description
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Artisan handcraft materials, stone quality, and wedding styling notes..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, padding: '12px 0' }}>
                  {submitting ? 'Saving to Database...' : 'Save & Publish Design'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE / EDIT MODAL */}
      {editingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '620px',
              background: '#fff',
              padding: '32px',
              borderRadius: '8px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>
                  Edit Bridal Design &amp; Photos
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px', fontFamily: 'monospace' }}>
                  ID: {editingProduct.id}
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <label className="input-label" style={{ fontSize: '13px' }}>
                Product Title *
                <input
                  type="text"
                  required
                  className="input"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </label>

              {/* Image Manager in Edit Modal */}
              <div style={{ background: '#faf8f6', padding: '16px', borderRadius: '6px', border: '1px solid var(--bd)' }}>
                <ImageGalleryManager
                  images={editingProduct.images || []}
                  onChange={(imgs) => setEditingProduct({ ...editingProduct, images: imgs })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                <label className="input-label" style={{ fontSize: '13px' }}>
                  Stock Count
                  <input
                    type="number"
                    required
                    className="input"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Category
                  <input
                    type="text"
                    disabled
                    className="input"
                    value={editingProduct.category}
                    style={{ background: '#f5f5f5', color: '#666' }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                <label className="input-label" style={{ fontSize: '13px' }}>
                  Regular Price (₹) *
                  <input
                    type="number"
                    required
                    className="input"
                    value={editingProduct.regularPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, regularPrice: Number(e.target.value) })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Sale Price (₹) *
                  <input
                    type="number"
                    required
                    className="input"
                    value={editingProduct.salePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingProduct.customisable}
                  onChange={(e) => setEditingProduct({ ...editingProduct, customisable: e.target.checked })}
                />
                Allow Name &amp; Date Personalisation (+₹200)
              </label>

              <label className="input-label" style={{ fontSize: '13px' }}>
                Description
                <textarea
                  className="input"
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, padding: '12px 0' }}>
                  {submitting ? 'Updating Database...' : 'Update & Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
