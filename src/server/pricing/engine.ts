import { prisma } from '@/lib/db'
import type {
  CartLineInput,
  PricedLine,
  QuoteResult,
  DiscountBreakdown,
  ShippingResult,
  CouponResult,
  PricingSettings,
} from './types'
import { DEFAULT_PRICING_SETTINGS } from './types'

// ---------------------------------------------------------------------------
// Main entry point: priceCart
// ---------------------------------------------------------------------------

/**
 * Pure pricing pipeline. Loads product data from DB but makes NO writes.
 * All money values in integer PAISE. Never passes floats through.
 */
export async function priceCart(
  lines: CartLineInput[],
  couponCode?: string,
  settingsOverride?: Partial<PricingSettings>
): Promise<QuoteResult> {
  const settings: PricingSettings = { ...DEFAULT_PRICING_SETTINGS, ...settingsOverride }
  const messages: string[] = []
  const discounts: DiscountBreakdown[] = []

  // ------------------------------------------------------------------
  // Step 1: Load products from DB, validate stock and build priced lines
  // ------------------------------------------------------------------
  const productIds = lines.map((l) => l.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, archived: false },
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
      regularPricePaise: true,
      salePricePaise: true,
      stock: true,
      customisable: true,
    },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  const pricedLines: PricedLine[] = []

  for (const line of lines) {
    const product = productMap.get(line.productId)
    if (!product) throw new Error(`Product ${line.productId} not found or archived`)
    const qty = Math.max(1, line.qty ?? line.quantity ?? 1)

    const unitPricePaise = product.salePricePaise
    const regularPricePaise = product.regularPricePaise

    // Customisation surcharge: ₹200 (2000 paise) if customisation text provided
    const customisationChargePaise = line.customisation ? 2000 : 0

    const lineTotalPaise = (unitPricePaise + customisationChargePaise) * qty

    const images = product.images as string[]

    pricedLines.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: images[0] ?? '',
      size: line.size,
      customisation: line.customisation,
      qty,
      unitPricePaise,
      regularPricePaise,
      itemOfferDiscountPaise: 0, // filled below
      lineTotalPaise,
      customisationChargePaise,
    })
  }

  // ------------------------------------------------------------------
  // Step 2: Load and apply active promotions (item-level)
  // ------------------------------------------------------------------
  const now = new Date()
  const activePromotions = await prisma.promotion.findMany({
    where: {
      active: true,
      type: { in: ['PRODUCT', 'QUANTITY_TIER'] },
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    },
  })

  let itemOfferDiscountPaise = 0

  for (const line of pricedLines) {
    const applicablePromos = activePromotions.filter((promo) => {
      const eligible = promo.eligibleProductIds as string[] | null
      return !eligible || eligible.includes(line.productId)
    })

    if (applicablePromos.length === 0) continue

    // Best single offer per line (no accidental double discount unless stackItemOffers)
    let bestDiscount = 0
    let bestLabel = ''

    for (const promo of applicablePromos) {
      let discount = 0
      if (promo.discountType === 'PERCENT') {
        discount = Math.floor((line.lineTotalPaise * promo.valueBp) / 10000)
      } else if (promo.discountType === 'FIXED') {
        discount = Math.min(promo.valueBp * line.qty, line.lineTotalPaise)
      }

      if (settings.stackItemOffers) {
        bestDiscount += discount
        bestLabel = 'Item Offers'
      } else if (discount > bestDiscount) {
        bestDiscount = discount
        bestLabel = promo.name
      }
    }

    if (bestDiscount > 0) {
      line.itemOfferDiscountPaise = bestDiscount
      line.lineTotalPaise -= bestDiscount
      itemOfferDiscountPaise += bestDiscount
      discounts.push({ type: 'ITEM_OFFER', label: bestLabel, amountPaise: bestDiscount })
    }
  }

  const subtotalPaise = pricedLines.reduce((s, l) => s + l.lineTotalPaise, 0)

  // ------------------------------------------------------------------
  // Step 3: Cart-level promotions
  // ------------------------------------------------------------------
  const cartPromos = await prisma.promotion.findMany({
    where: {
      active: true,
      type: { in: ['CART', 'FLASH'] },
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    },
  })

  let cartPromoDiscountPaise = 0
  let bestCartPromo: typeof cartPromos[0] | null = null
  let bestCartDiscount = 0

  for (const promo of cartPromos) {
    if (subtotalPaise < promo.minSpendPaise) continue
    let discount = 0
    if (promo.discountType === 'PERCENT') {
      discount = Math.floor((subtotalPaise * promo.valueBp) / 10000)
    } else if (promo.discountType === 'FIXED') {
      discount = Math.min(promo.valueBp, subtotalPaise)
    }
    if (discount > bestCartDiscount) {
      bestCartDiscount = discount
      bestCartPromo = promo
    }
  }

  if (bestCartPromo && bestCartDiscount > 0) {
    cartPromoDiscountPaise = bestCartDiscount
    discounts.push({ type: 'CART_PROMO', label: bestCartPromo.name, amountPaise: bestCartDiscount })
  }

  const afterCartSubtotal = subtotalPaise - cartPromoDiscountPaise

  // ------------------------------------------------------------------
  // Step 4: Coupon
  // ------------------------------------------------------------------
  let couponResult: CouponResult | null = null
  let couponDiscountPaise = 0

  if (couponCode) {
    couponResult = await validateCoupon(couponCode, afterCartSubtotal, productIds)
    if (couponResult.valid) {
      couponDiscountPaise = couponResult.discountPaise
      discounts.push({ type: 'COUPON', label: `Coupon: ${couponCode}`, amountPaise: couponDiscountPaise })
    }
  }

  const afterCouponSubtotal = afterCartSubtotal - couponDiscountPaise

  // ------------------------------------------------------------------
  // Step 5: Shipping
  // ------------------------------------------------------------------
  const shipping = computeShipping(afterCouponSubtotal, settings)
  const shippingPaise = shipping.amountPaise

  if (shipping.isFree && !discounts.some((d) => d.type === 'SHIPPING')) {
    discounts.push({ type: 'SHIPPING', label: 'Free Shipping', amountPaise: 0 })
  }

  if (shipping.freeShippingRemainingPaise !== null && shipping.freeShippingRemainingPaise > 0) {
    messages.push(
      `Add ₹${Math.ceil(shipping.freeShippingRemainingPaise / 100)} more for free shipping!`
    )
  }

  // ------------------------------------------------------------------
  // Step 6: Tax
  // ------------------------------------------------------------------
  let taxPaise = 0
  if (settings.taxMode === 'EXCLUSIVE' && settings.taxRateBp > 0) {
    taxPaise = Math.floor((afterCouponSubtotal * settings.taxRateBp) / 10000)
  }
  // INCLUSIVE: tax already in price, shown separately but not added
  // NONE: no tax

  // ------------------------------------------------------------------
  // Step 7: Total
  // ------------------------------------------------------------------
  const totalPaise = afterCouponSubtotal + shippingPaise + (settings.taxMode === 'EXCLUSIVE' ? taxPaise : 0)

  // Sanity: total must never be negative
  if (totalPaise < 0) throw new Error('Pricing invariant violated: totalPaise < 0')

  return {
    lines: pricedLines,
    subtotalPaise,
    itemOfferDiscountPaise,
    cartPromoDiscountPaise,
    coupon: couponResult,
    couponDiscountPaise,
    shippingPaise,
    taxPaise,
    taxMode: settings.taxMode,
    taxRateBp: settings.taxRateBp,
    totalPaise,
    discounts,
    shipping,
    messages,
  }
}

// ---------------------------------------------------------------------------
// Coupon validator
// ---------------------------------------------------------------------------

async function validateCoupon(
  code: string,
  spendPaise: number,
  productIds: string[]
): Promise<CouponResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: { _count: { select: { redemptions: true } } },
  })

  if (!coupon) return { valid: false, code, discountPaise: 0, errorCode: 'NOT_FOUND', errorMessage: 'Coupon not found' }
  if (!coupon.active) return { valid: false, code, discountPaise: 0, errorCode: 'INACTIVE', errorMessage: 'Coupon is not active' }

  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) return { valid: false, code, discountPaise: 0, errorCode: 'EXPIRED', errorMessage: 'Coupon not yet active' }
  if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, code, discountPaise: 0, errorCode: 'EXPIRED', errorMessage: 'Coupon has expired' }
  if (spendPaise < coupon.minSpendPaise) {
    return { valid: false, code, discountPaise: 0, errorCode: 'MIN_SPEND', errorMessage: `Minimum spend ₹${Math.ceil(coupon.minSpendPaise / 100)} required` }
  }
  if (coupon.usageLimit !== null && coupon._count.redemptions >= coupon.usageLimit) {
    return { valid: false, code, discountPaise: 0, errorCode: 'USAGE_LIMIT', errorMessage: 'Coupon usage limit reached' }
  }

  // Check scope
  const eligible = coupon.eligibleProductIds as string[] | null
  if (eligible && eligible.length > 0) {
    const hasEligible = productIds.some((id) => eligible.includes(id))
    if (!hasEligible) return { valid: false, code, discountPaise: 0, errorCode: 'SCOPE', errorMessage: 'Coupon not applicable to items in cart' }
  }

  // Compute discount
  let discountPaise = 0
  if (coupon.discountType === 'PERCENT') {
    discountPaise = Math.floor((spendPaise * coupon.valueBp) / 10000)
  } else if (coupon.discountType === 'FIXED') {
    discountPaise = Math.min(coupon.valueBp, spendPaise)
  }

  return { valid: true, code, discountPaise }
}

// ---------------------------------------------------------------------------
// Shipping calculator
// ---------------------------------------------------------------------------

function computeShipping(subtotalPaise: number, settings: PricingSettings): ShippingResult {
  if (settings.freeShippingThresholdPaise > 0 && subtotalPaise >= settings.freeShippingThresholdPaise) {
    return { amountPaise: 0, isFree: true, freeShippingRemainingPaise: 0 }
  }

  const remaining = settings.freeShippingThresholdPaise > 0
    ? settings.freeShippingThresholdPaise - subtotalPaise
    : null

  return {
    amountPaise: settings.flatShippingPaise,
    isFree: false,
    freeShippingRemainingPaise: remaining,
  }
}

// ---------------------------------------------------------------------------
// Settings loader — reads from DB Setting table
// ---------------------------------------------------------------------------

export async function loadPricingSettings(): Promise<PricingSettings> {
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'freeShippingThresholdPaise',
          'flatShippingPaise',
          'taxMode',
          'taxRateBp',
          'stackItemOffers',
        ],
      },
    },
  })

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return {
    freeShippingThresholdPaise: parseInt(map.freeShippingThresholdPaise ?? '50000'),
    flatShippingPaise: parseInt(map.flatShippingPaise ?? '8000'),
    taxMode: (map.taxMode as 'NONE' | 'INCLUSIVE' | 'EXCLUSIVE') ?? 'NONE',
    taxRateBp: parseInt(map.taxRateBp ?? '0'),
    stackItemOffers: map.stackItemOffers === 'true',
  }
}

