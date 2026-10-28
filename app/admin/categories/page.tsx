'use client'

import React, { useState } from 'react'
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

const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Bridal Bangles',
    slug: 'bridal-bangles',
    parent: null,
    productCount: 42,
    isVisible: true,
    description: 'Custom silk thread, Kundan, and pearl sets tailored to your wedding lehenga & saree.',
    image: '/images/hero_bangles.jpg',
  },
  {
    id: 'cat-2',
    name: 'Customised Bangles',
    slug: 'customised',
    parent: 'Bridal Bangles',
    productCount: 18,
    isVisible: true,
    description: 'Embossed bride & groom names, wedding dates, and bridal hashtags in gold foil.',
    image: '/images/name_bangles.jpg',
  },
  {
    id: 'cat-3',
    name: 'Hair Clips & Pins',
    slug: 'hair-clips',
    parent: null,
    productCount: 31,
    isVisible: true,
    description: 'Jadabi floral hair extensions, poola jada clips, and bridal barrettes.',
    image: '/images/pearl_hair_clip.jpg',
  },
  {
    id: 'cat-4',
    name: 'Bridesmaid Favours',
    slug: 'bridesmaid',
    parent: null,
    productCount: 22,
    isVisible: true,
    description: 'Coordinated bangle sets, potli bags, and gift boxes for your bride tribe.',
    image: '/images/kundan_set.jpg',
  },
  {
    id: 'cat-5',
    name: 'Gift Sets & Trousseau Trunks',
    slug: 'gift-sets',
    parent: null,
    productCount: 14,
    isVisible: true,
    description: 'Curated bridal trousseau sets complete with presentation velvet trunks.',
    image: '/images/trousseau_box.jpg',
  },
]

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES)
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')
  const [description, setDescription] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const newCat: CategoryItem = {
      id: 'cat-' + Date.now(),
      name: name.trim(),
      slug,
      parent: parent || null,
      productCount: 0,
      isVisible: true,
      description,
      image: '/images/hero_bangles.jpg',
    }

    setCategories([...categories, newCat])
    setName('')
    setParent('')
    setDescription('')
    setShowAddForm(false)
    showToast(`Category "${newCat.name}" added successfully!`)
  }

  const moveCategory = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= categories.length) return
    const updated = [...categories]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setCategories(updated)
  }

  const toggleVisibility = (id: string) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c))
    )
  }

  const archiveCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
    showToast('Category archived.')
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
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--dk)', margin: 0 }}>
            Collection Categories
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '14px', marginTop: '4px' }}>
            Organize bridal jewellery taxonomy, storefront navigation hierarchy, and catalog filters.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '10px 20px' }}
        >
          {showAddForm ? '✕ Close Form' : '+ Add New Category'}
        </button>
      </div>

      {/* Add New Category Card */}
      {showAddForm && (
        <div className="card" style={{ padding: '24px', background: '#FFFDFB', border: '1.5px solid var(--pr)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
            Create New Category
          </h2>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <label className="input-label">
                <span>Category Name</span>
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
                <span>Parent Category (Optional)</span>
                <select
                  className="input"
                  value={parent}
                  onChange={(e) => setParent(e.target.value)}
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !c.parent)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

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
                Save Category
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
                <th style={{ padding: '12px' }}>Order</th>
                <th style={{ padding: '12px' }}>Category Name &amp; URL</th>
                <th style={{ padding: '12px' }}>Parent Category</th>
                <th style={{ padding: '12px' }}>Products</th>
                <th style={{ padding: '12px' }}>Visibility</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #F0E8E6' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => moveCategory(idx, -1)}
                        disabled={idx === 0}
                        style={{
                          background: 'none',
                          border: '1px solid var(--bd)',
                          padding: '2px 8px',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: idx === 0 ? 0.3 : 1,
                        }}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveCategory(idx, 1)}
                        disabled={idx === categories.length - 1}
                        style={{
                          background: 'none',
                          border: '1px solid var(--bd)',
                          padding: '2px 8px',
                          cursor: idx === categories.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: idx === categories.length - 1 ? 0.3 : 1,
                        }}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>

                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--dk)', fontSize: '14px' }}>{cat.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '2px' }}>
                      <Link href={`/category/${cat.slug}`} target="_blank" style={{ color: 'var(--pr)', textDecoration: 'none' }}>
                        /category/{cat.slug} ↗
                      </Link>
                    </div>
                  </td>

                  <td style={{ padding: '14px 12px', color: cat.parent ? 'var(--dk)' : 'var(--tx2)' }}>
                    {cat.parent || '—'}
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
                        onClick={() => toggleVisibility(cat.id)}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '12px', padding: '4px 10px', minHeight: '30px' }}
                      >
                        {cat.isVisible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => archiveCategory(cat.id)}
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: '12px', padding: '4px 10px', minHeight: '30px', color: 'var(--er)' }}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

