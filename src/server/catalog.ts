// Server-only module: imports Prisma.
import { prisma } from '@/lib/db'
import type { Product, Category } from '@/lib/data'
import { ratingsFor } from '@/src/server/reviews'

// ---------------------------------------------------------------------------
// Catalogue reads for server components. The storefront renders real products
// only — there is no mock fallback; empty means empty, unknown means 404.
// ---------------------------------------------------------------------------

const productSelect = {
  id: true,
  name: true,
  slug: true,
  regularPricePaise: true,
  salePricePaise: true,
  stock: true,
  customisable: true,
  isBestSeller: true,
  isNew: true,
  rating: true,
  reviewCount: true,
  description: true,
  details: true,
  images: true,
  sizes: true,
  category: { select: { name: true, slug: true } },
} as const

type DbProduct = {
  id: string
  name: string
  slug: string
  regularPricePaise: number
  salePricePaise: number
  stock: number
  customisable: boolean
  isBestSeller: boolean
  isNew: boolean
  rating: number
  reviewCount: number
  description: string
  details: unknown
  images: unknown
  sizes: unknown
  category: { name: string; slug: string }
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

export function toProductView(p: DbProduct): Product {
  const regular = p.regularPricePaise / 100
  const sale = p.salePricePaise / 100
  const images = strings(p.images)
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category.name,
    categorySlug: p.category.slug,
    regularPrice: regular,
    salePrice: sale,
    discountPercent: regular > sale ? Math.round(((regular - sale) / regular) * 100) : 0,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isBestSeller: p.isBestSeller,
    isNew: p.isNew,
    customisable: p.customisable,
    stock: p.stock,
    description: p.description,
    details: strings(p.details),
    images: images.length ? images : ['/images/hero_bangles.jpg'],
    sizes: strings(p.sizes),
  }
}

/** Star rating and count come only from approved reviews, never stored guesses. */
async function withLiveRatings(products: Product[]): Promise<Product[]> {
  const stats = await ratingsFor(products.map((p) => p.id))
  return products.map((p) => ({ ...p, rating: stats.get(p.id)?.rating ?? 0, reviewCount: stats.get(p.id)?.count ?? 0 }))
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const p = await prisma.product.findFirst({ where: { slug, archived: false }, select: productSelect })
  return p ? (await withLiveRatings([toProductView(p)]))[0] : null
}

export interface PublicReview {
  id: string
  name: string
  rating: number
  body: string
  verifiedPurchase: boolean
  artisanReply: string | null
  createdAt: Date
}

export async function listApprovedReviews(productId: string): Promise<PublicReview[]> {
  const rows = await prisma.review.findMany({
    where: { productId, visible: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, guestName: true, rating: true, body: true, verifiedPurchase: true, artisanReply: true, createdAt: true, user: { select: { name: true } } },
  })
  return rows.map((r) => ({
    id: r.id,
    name: (r.user?.name ?? r.guestName ?? 'Customer').split(/\s+/)[0],
    rating: r.rating,
    body: r.body,
    verifiedPurchase: r.verifiedPurchase,
    artisanReply: r.artisanReply,
    createdAt: r.createdAt,
  }))
}

export async function listProducts(opts: { categorySlug?: string; take?: number; bestSellersFirst?: boolean } = {}): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { archived: false, ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}) },
    orderBy: opts.bestSellersFirst ? [{ isBestSeller: 'desc' }, { createdAt: 'desc' }] : { createdAt: 'desc' },
    take: opts.take,
    select: productSelect,
  })
  return withLiveRatings(rows.map(toProductView))
}

export interface CategoryView extends Category {
  itemCount: number
}

/** Categories that have at least one live product, in admin sort order. */
export async function listCategories(opts: { includeEmpty?: boolean } = {}): Promise<CategoryView[]> {
  const rows = await prisma.category.findMany({
    where: { archived: false },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { archived: false } } } } },
  })
  return rows
    .filter((c) => opts.includeEmpty || c._count.products > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      description: c.description,
      itemCount: c._count.products,
    }))
}

export async function getCategoryBySlug(slug: string): Promise<CategoryView | null> {
  const c = await prisma.category.findFirst({
    where: { slug, archived: false },
    include: { _count: { select: { products: { where: { archived: false } } } } },
  })
  return c ? { id: c.id, name: c.name, slug: c.slug, image: c.image, description: c.description, itemCount: c._count.products } : null
}

export interface PublicCoupon {
  code: string
  description: string
  discountType: 'PERCENT' | 'FIXED' | 'BUNDLE_PRICE'
  valueBp: number
  minSpendPaise: number
  expiresAt: Date | null
}

/**
 * Coupons safe to advertise: active, in date, and unlimited (usageLimit null).
 * Limited or one-off codes are treated as private and never listed.
 */
export async function listPublicCoupons(): Promise<PublicCoupon[]> {
  const now = new Date()
  return prisma.coupon.findMany({
    where: {
      active: true,
      usageLimit: null,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { code: true, description: true, discountType: true, valueBp: true, minSpendPaise: true, expiresAt: true },
  }).then((rows) => rows.map((r) => ({ ...r, description: r.description ?? '' })))
}

export function couponHeadline(c: PublicCoupon): string {
  if (c.discountType === 'PERCENT') return `${c.valueBp / 100}% off`
  return `₹${Math.round(c.valueBp / 100).toLocaleString('en-IN')} off`
}

// ---------------------------------------------------------------------------
// Store contact details (Settings → Store details). One source for every
// phone number, WhatsApp link and email shown on the storefront.
// ---------------------------------------------------------------------------

export interface StoreContact {
  storeName: string
  whatsapp: string // digits incl. country code, e.g. 919840212345
  phone: string // digits incl. country code
  email: string
  address: string
}

export const DEFAULT_STORE_CONTACT: StoreContact = {
  storeName: 'AVAL Store',
  whatsapp: '919840212345',
  phone: '919840212345',
  email: 'contact@avalstore.com',
  address: 'Kanyakumari, Tamil Nadu',
}

const withCountryCode = (v: string | undefined) => {
  const d = (v ?? '').replace(/\D/g, '')
  if (!d) return ''
  return d.length === 10 ? `91${d}` : d
}

export async function getStoreContact(): Promise<StoreContact> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['store_name', 'whatsapp_number', 'contact_phone', 'contact_email', 'workshop_address'] } },
  })
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const whatsapp = withCountryCode(m.whatsapp_number) || DEFAULT_STORE_CONTACT.whatsapp
  return {
    storeName: m.store_name || DEFAULT_STORE_CONTACT.storeName,
    whatsapp,
    phone: withCountryCode(m.contact_phone) || whatsapp,
    email: m.contact_email || DEFAULT_STORE_CONTACT.email,
    address: m.workshop_address || DEFAULT_STORE_CONTACT.address,
  }
}
