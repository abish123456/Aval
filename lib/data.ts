// Shared storefront types. Catalogue data lives in the database (see src/server/catalog.ts).

export interface Product {
  id: string
  name: string
  slug: string
  category: string
  categorySlug: string
  regularPrice: number
  salePrice: number
  discountPercent: number
  rating: number
  reviewCount: number
  isBestSeller?: boolean
  isNew?: boolean
  customisable: boolean
  stock: number
  description: string
  details: string[]
  images: string[]
  sizes: string[]
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  itemCount: number
  description: string
}
