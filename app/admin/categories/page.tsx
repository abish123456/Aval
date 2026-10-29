'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface CategoryItem {
  id: string
  name: string
  slug: string
  parent: string | null
  productCount: number
  isVisible: boolean
  description: string
  image: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load live categories from MySQL
  const loadCategories = () => {
    setLoading(true)
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCategories(
            res.data.map((c: { id: string; name: string; slug: string; description: string; image: string; productCount: number; archived: boolean }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              parent: null,
              productCount: c.productCount ?? 0,
              isVisible: !c.archived,
              description: c.description ?? '',
              image: c.image || '/images/hero_bangles.jpg',
            }))
          )
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // CREATE
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug, description }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setName('')
        setDescription('')
        setShowAddForm(false)
        loadCategories()
        showToast(`Category "${name}" created successfully!`)
      } else {
        alert(data.error || 'Failed to create category.')
      }
    } catch {
      alert('Network error while creating category.')
    }
  }

  // UPDATE
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCategory.name,
          slug: editingCategory.slug,
          description: editingCategory.description,
          archived: !editingCategory.isVisible,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setEditingCategory(null)
        loadCategories()
        showToast('Category updated successfully!')
      } else {
        alert(data.error || 'Failed to update category.')
      }
    } catch {
      alert('Network error while updating category.')
    }
  }

  // DELETE
  const handleDeleteCategory = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
        showToast('Category deleted successfully.')
      } else {
        alert('Could not delete category (it may still have linked products).')
      }
    } catch {
      alert('Network error while deleting category.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--dk)',
            color: '#fff',
            padding: '12px 20px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '14px',
            borderLeft: '4px solid var(--ok)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', margin: 0, fontWeight: 600 }}>
            Collection Categories (Full CRUD)
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
            Create, Read, Update, and Delete bridal categories and storefront navigation in real-time.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showAddForm ? 'Close Form' : 'Add New Category'}
        </button>
      </div>

      {/* CREATE FORM */}
      {showAddForm && (
        <div className="card" style={{ padding: '24px', background: '#FFFDFB', border: '1.5px solid var(--pr)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
            Create New Category
          </h2>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="input-label">
              <span>Category Name *</span>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Bridal Matha Patti"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="input-label">
              <span>Category Description</span>
              <textarea
                className="input"
                rows={2}
                placeholder="Brief description for SEO and category page header..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                Save &amp; Create Category
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="card" style={{ padding: '24px', background: '#fff' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>No categories found in database.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
                  <th style={{ padding: '12px' }}>Category Name &amp; URL</th>
                  <th style={{ padding: '12px' }}>Products</th>
                  <th style={{ padding: '12px' }}>Visibility</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #F0E8E6' }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--dk)', fontSize: '14px' }}>{cat.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '2px' }}>
                        <Link href={`/category/${cat.slug}`} target="_blank" style={{ color: 'var(--pr)', textDecoration: 'none' }}>
                          /category/{cat.slug} ↗
                        </Link>
                      </div>
                    </td>

                    <td style={{ padding: '14px 12px', fontWeight: 600 }}>{cat.productCount} pieces</td>

                    <td style={{ padding: '14px 12px' }}>
                      <span className={`tag ${cat.isVisible ? 'tag-ok' : 'tag-warning'}`}>
                        {cat.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditingCategory({ ...cat })}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '12px', padding: '4px 12px', minHeight: '30px' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
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

      {/* UPDATE / EDIT CATEGORY MODAL */}
      {editingCategory && (
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
              maxWidth: '500px',
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
                  Edit Category
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px', fontFamily: 'monospace' }}>
                  ID: {editingCategory.id}
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="input-label" style={{ fontSize: '13px' }}>
                Category Name *
                <input
                  type="text"
                  required
                  className="input"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </label>

              <label className="input-label" style={{ fontSize: '13px' }}>
                URL Slug *
                <input
                  type="text"
                  required
                  className="input"
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                />
              </label>

              <label className="input-label" style={{ fontSize: '13px' }}>
                Description
                <textarea
                  className="input"
                  rows={2}
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingCategory.isVisible}
                  onChange={(e) => setEditingCategory({ ...editingCategory, isVisible: e.target.checked })}
                />
                Visible in Storefront
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 0' }}>
                  Update Category
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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
