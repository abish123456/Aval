import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/db'
import { loadPricingSettings } from '@/src/server/pricing/engine'

type Db = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Enquiry pricing — the server is the only source of prices.
// The browser sends product ids, sizes, quantities, personalisation text and
// an optional coupon code. Everything else is computed here.
// ---------------------------------------------------------------------------

export const CUSTOMISATION_CHARGE_PAISE = 20000 // ₹200 (paise), matches the storefront

export interface EnquiryLineInput {
  productId: string
  size: string
  qty: number
  customName?: string
  weddingDate?: string
}

export interface EnquiryLine {
  productId: string
  productName: string
  slug: string
  image: string
  size: string
  qty: number
  unitPaise: number
  customName?: string
  weddingDate?: string
}

export interface EnquiryQuote {
  lines: EnquiryLine[]
  subtotalPaise: number
  couponCode: string | null
  couponError: string | null
  discountPaise: number
  shippingPaise: number
  totalPaise: number
  freeShippingThresholdPaise: number
  freeShippingRemainingPaise: number
}

export class EnquiryItemError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnquiryItemError'
  }
}

export class CouponError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CouponError'
  }
}

async function priceLines(db: Db, input: EnquiryLineInput[]): Promise<EnquiryLine[]> {
  const ids = [...new Set(input.map((l) => l.productId))]
  const products = await db.product.findMany({
    where: { id: { in: ids }, archived: false },
    select: { id: true, name: true, slug: true, images: true, salePricePaise: true, stock: true, sizes: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  // Total quantity per product across lines, for the stock check
  const qtyByProduct = new Map<string, number>()
  for (const l of input) qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.qty)

  return input.map((l) => {
    const product = byId.get(l.productId)
    if (!product) {
      throw new EnquiryItemError(
        'One or more items in your bag are no longer available. Please remove them and add them again from the shop.'
      )
    }
    if ((qtyByProduct.get(product.id) ?? 0) > product.stock) {
      throw new EnquiryItemError(
        product.stock > 0
          ? `Only ${product.stock} of "${product.name}" left. Please reduce the quantity.`
          : `"${product.name}" is out of stock. Please remove it from your bag.`
      )
    }
    const sizes = Array.isArray(product.sizes) ? (product.sizes as string[]) : []
    if (sizes.length > 0 && !sizes.includes(l.size)) {
      throw new EnquiryItemError(`Please choose a valid size for "${product.name}".`)
    }

    const customName = l.customName?.trim() || undefined
    const unitPaise = product.salePricePaise + (customName ? CUSTOMISATION_CHARGE_PAISE : 0)
    const images = Array.isArray(product.images) ? (product.images as string[]) : []

    return {
      productId: product.id,
      productName: product.name + (customName ? ` (Custom: ${customName})` : ''),
      slug: product.slug,
      image: images[0] ?? '',
      size: l.size,
      qty: l.qty,
      unitPaise,
      ...(customName ? { customName } : {}),
      ...(l.weddingDate?.trim() ? { weddingDate: l.weddingDate.trim() } : {}),
    }
  })
}

/**
 * Validate a coupon against the lines. Returns the discount in paise.
 * `customerWhatsapp` enables the per-customer limit (only known at order time).
 */
async function couponDiscount(
  db: Db,
  rawCode: string,
  lines: EnquiryLine[],
  subtotalPaise: number,
  customerWhatsapp?: string
): Promise<{ code: string; discountPaise: number }> {
  const code = rawCode.trim().toUpperCase()
  const coupon = await db.coupon.findUnique({ where: { code } })
  const now = new Date()
  if (!coupon || !coupon.active) throw new CouponError('This coupon code is not valid.')
  if (coupon.startsAt && coupon.startsAt > now) throw new CouponError('This coupon is not active yet.')
  if (coupon.expiresAt && coupon.expiresAt < now) throw new CouponError('This coupon has expired.')
  if (subtotalPaise < coupon.minSpendPaise) {
    throw new CouponError(`Add items worth ₹${Math.ceil(coupon.minSpendPaise / 100).toLocaleString('en-IN')} or more to use this coupon.`)
  }

  // Usage counts: live enquiries using the code + legacy order redemptions
  if (coupon.usageLimit !== null) {
    const [enquiryUses, orderUses] = await Promise.all([
      db.enquiry.count({ where: { couponCode: code, status: { not: 'CANCELLED' } } }),
      db.couponRedemption.count({ where: { couponId: coupon.id } }),
    ])
    if (enquiryUses + orderUses >= coupon.usageLimit) throw new CouponError('This coupon has been fully used.')
  }
  if (customerWhatsapp) {
    const mine = await db.enquiry.count({
      where: { couponCode: code, customerWhatsapp, status: { not: 'CANCELLED' } },
    })
    if (mine >= coupon.perCustomerLimit) throw new CouponError('You have already used this coupon.')
  }

  // Scoped coupons only discount eligible lines
  const eligible = Array.isArray(coupon.eligibleProductIds) ? (coupon.eligibleProductIds as string[]) : null
  const base =
    eligible && eligible.length > 0
      ? lines.filter((l) => eligible.includes(l.productId)).reduce((s, l) => s + l.unitPaise * l.qty, 0)
      : subtotalPaise
  if (base === 0) throw new CouponError('This coupon does not apply to the items in your bag.')

  let discountPaise = 0
  if (coupon.discountType === 'PERCENT') {
    discountPaise = Math.floor((base * Math.min(coupon.valueBp, 10000)) / 10000)
  } else if (coupon.discountType === 'FIXED') {
    discountPaise = Math.min(coupon.valueBp, base)
  }
  return { code, discountPaise: Math.max(0, Math.min(discountPaise, subtotalPaise)) }
}

/**
 * Full price for a bag. With `strictCoupon` an invalid coupon throws (order time);
 * otherwise it is reported in `couponError` and ignored (cart preview).
 */
export async function quoteEnquiry(
  input: EnquiryLineInput[],
  opts: { couponCode?: string | null; customerWhatsapp?: string; strictCoupon?: boolean; db?: Db } = {}
): Promise<EnquiryQuote> {
  const db = opts.db ?? prisma
  const lines = await priceLines(db, input)
  const subtotalPaise = lines.reduce((s, l) => s + l.unitPaise * l.qty, 0)

  let couponCode: string | null = null
  let couponError: string | null = null
  let discountPaise = 0
  if (opts.couponCode?.trim()) {
    try {
      const c = await couponDiscount(db, opts.couponCode, lines, subtotalPaise, opts.customerWhatsapp)
      couponCode = c.code
      discountPaise = c.discountPaise
    } catch (err) {
      if (!(err instanceof CouponError)) throw err
      if (opts.strictCoupon) throw err
      couponError = err.message
    }
  }

  const settings = await loadPricingSettings()
  const afterDiscount = subtotalPaise - discountPaise
  const free = settings.freeShippingThresholdPaise > 0 && afterDiscount >= settings.freeShippingThresholdPaise
  const shippingPaise = free || afterDiscount === 0 ? 0 : settings.flatShippingPaise

  return {
    lines,
    subtotalPaise,
    couponCode,
    couponError,
    discountPaise,
    shippingPaise,
    totalPaise: afterDiscount + shippingPaise,
    freeShippingThresholdPaise: settings.freeShippingThresholdPaise,
    freeShippingRemainingPaise: free ? 0 : Math.max(0, settings.freeShippingThresholdPaise - afterDiscount),
  }
}

// ---------------------------------------------------------------------------
// Stock — reserved when an enquiry is placed, returned when it is cancelled.
// ---------------------------------------------------------------------------

export async function reserveStock(tx: Prisma.TransactionClient, lines: EnquiryLine[], note: string) {
  // Lock rows in a stable order to avoid deadlocks between concurrent orders
  const totals = new Map<string, number>()
  for (const l of lines) totals.set(l.productId, (totals.get(l.productId) ?? 0) + l.qty)
  for (const [productId, qty] of [...totals].sort(([a], [b]) => a.localeCompare(b))) {
    const updated = await tx.product.updateMany({
      where: { id: productId, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    })
    if (updated.count === 0) {
      throw new EnquiryItemError('An item in your bag just sold out. Please review your bag and try again.')
    }
    await tx.inventoryMovement.create({ data: { productId, delta: -qty, reason: 'SALE', note } })
  }
}

/** Returns stock for a cancelled enquiry exactly once. */
export async function releaseStock(tx: Prisma.TransactionClient, enquiryId: string, note: string) {
  const claimed = await tx.enquiry.updateMany({
    where: { id: enquiryId, stockReleased: false },
    data: { stockReleased: true },
  })
  if (claimed.count === 0) return
  const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId }, select: { items: true } })
  const lines = (Array.isArray(enquiry?.items) ? enquiry.items : []) as unknown as EnquiryLine[]
  for (const l of lines) {
    if (!l?.productId || !l.qty) continue
    const updated = await tx.product.updateMany({ where: { id: l.productId }, data: { stock: { increment: l.qty } } })
    if (updated.count > 0) {
      await tx.inventoryMovement.create({ data: { productId: l.productId, delta: l.qty, reason: 'RETURN', note } })
    }
  }
}

// ---------------------------------------------------------------------------
// Payment confirmation — shared by the Razorpay webhook and the checkout
// callback. Idempotent; never revives a cancelled enquiry.
// ---------------------------------------------------------------------------

export type ConfirmResult = 'CONFIRMED' | 'ALREADY_PAID' | 'NOT_FOUND' | 'AMOUNT_MISMATCH' | 'PAID_AFTER_CANCEL'

export async function confirmEnquiryPayment(params: {
  razorpayOrderId: string
  razorpayPaymentId: string
  amountPaise?: number // present for webhooks; the callback has no amount
}): Promise<ConfirmResult> {
  const enquiry = await prisma.enquiry.findFirst({ where: { razorpayOrderId: params.razorpayOrderId } })
  if (!enquiry) return 'NOT_FOUND'
  if (enquiry.paymentStatus === 'PAID') return 'ALREADY_PAID'

  if (params.amountPaise !== undefined && params.amountPaise !== enquiry.totalPaise) {
    console.error(
      `[Enquiry payment] Amount mismatch for ${enquiry.token}: paid ${params.amountPaise}, expected ${enquiry.totalPaise}`
    )
    return 'AMOUNT_MISMATCH'
  }

  if (enquiry.status === 'CANCELLED') {
    // Money arrived for a cancelled order: record it, keep it cancelled, flag a refund.
    await prisma.enquiry.updateMany({
      where: { id: enquiry.id, paymentStatus: { not: 'PAID' } },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: params.razorpayPaymentId,
        adminNotes: `${enquiry.adminNotes ? enquiry.adminNotes + '\n' : ''}REFUND REQUIRED: payment ${params.razorpayPaymentId} received after cancellation.`,
      },
    })
    return 'PAID_AFTER_CANCEL'
  }

  // Conditional update: only the first concurrent caller flips the status.
  const updated = await prisma.enquiry.updateMany({
    where: { id: enquiry.id, paymentStatus: { not: 'PAID' }, status: { not: 'CANCELLED' } },
    data: {
      paymentStatus: 'PAID',
      razorpayPaymentId: params.razorpayPaymentId,
      ...(enquiry.status === 'ENQUIRY' ? { status: 'CONFIRMED' as const } : {}),
    },
  })
  return updated.count > 0 ? 'CONFIRMED' : 'ALREADY_PAID'
}

/** Turn Zod issues into { field: message } for forms. */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.')
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}
