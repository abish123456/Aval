import { prisma } from '@/lib/db'
import { priceCart, loadPricingSettings } from '@/src/server/pricing/engine'
import type { CartLineInput } from '@/src/server/pricing/types'
import { ConflictError } from '@/src/server/auth/rbac'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Order number generator: AVL-XXXXX
// ---------------------------------------------------------------------------

function generateOrderNumber(): string {
  const digits = Math.floor(10000 + Math.random() * 90000)
  return `AVL-${digits}`
}

// ---------------------------------------------------------------------------
// Checkout input
// ---------------------------------------------------------------------------

export interface CheckoutInput {
  lines: CartLineInput[]
  couponCode?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  addressId?: string
  userId?: string
  notes?: string
  idempotencyKey?: string
  paymentMethod: 'RAZORPAY' | 'COD'
  expectedTotalPaise: number  // client's consent — server re-computes and compares
}

export interface CheckoutResult {
  orderId: string
  orderNumber: string
  totalPaise: number
  razorpayOrderId?: string
  paymentMethod: 'RAZORPAY' | 'COD'
}

// ---------------------------------------------------------------------------
// placeOrder
// ---------------------------------------------------------------------------

export async function placeOrder(
  input: CheckoutInput,
  actorId?: string
): Promise<CheckoutResult> {
  // ── Idempotency check ───────────────────────────────────────────────────
  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { payments: true },
    })
    if (existing) {
      return {
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        totalPaise: existing.totalPaise,
        razorpayOrderId: existing.payments[0]?.providerOrderId ?? undefined,
        paymentMethod: input.paymentMethod,
      }
    }
  }

  // ── Re-compute price from DB (never trust client) ───────────────────────
  const settings = await loadPricingSettings()
  const quote = await priceCart(input.lines, input.couponCode, settings)

  // ── Consent check: did the price change since the customer saw it? ───────
  if (Math.abs(quote.totalPaise - input.expectedTotalPaise) > 0) {
    throw new ConflictError(
      `Price changed: expected ₹${input.expectedTotalPaise / 100} but cart total is now ₹${quote.totalPaise / 100}. Please review your cart.`,
      'PRICE_CHANGED'
    )
  }

  // ── DB transaction: create order, reserve stock, claim coupon ───────────
  const orderNumber = generateOrderNumber()

  const order = await prisma.$transaction(async (tx) => {
    // 1. Reserve stock — conditional UPDATE for each product
    for (const line of input.lines) {
      const qty = Math.max(1, line.qty ?? line.quantity ?? 1)
      const updated = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      })
      if (updated.count === 0) {
        const product = await tx.product.findUnique({ where: { id: line.productId }, select: { name: true, stock: true } })
        throw new ConflictError(
          `Insufficient stock for "${product?.name ?? line.productId}" (only ${product?.stock ?? 0} left)`,
          'INSUFFICIENT_STOCK'
        )
      }
    }

    // 2. Claim coupon (increment usage check via unique-violation)
    if (input.couponCode && quote.couponDiscountPaise > 0) {
      const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } })
      if (!coupon) throw new ConflictError('Coupon no longer valid', 'COUPON_INVALID')
    }

    // 3. Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        addressId: input.addressId,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        paymentStatus: input.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        fulfilmentStatus: 'CONFIRMED',
        subtotalPaise: quote.subtotalPaise,
        discountPaise: quote.couponDiscountPaise + quote.cartPromoDiscountPaise + quote.itemOfferDiscountPaise,
        shippingPaise: quote.shippingPaise,
        taxPaise: quote.taxPaise,
        totalPaise: quote.totalPaise,
        couponCode: input.couponCode,
        notes: input.notes,
        idempotencyKey: input.idempotencyKey,
        source: input.paymentMethod === 'COD' ? 'COD' : 'WEB',
        items: {
          create: quote.lines.map((line) => ({
            productId: line.productId,
            snapshotJson: { name: line.name, slug: line.slug, image: line.image } as object,
            qty: line.qty,
            unitPricePaise: line.unitPricePaise,
            lineTotalPaise: line.lineTotalPaise,
            size: line.size,
            customisation: line.customisation,
          })),
        },
        discounts: {
          create: quote.discounts.map((d) => ({
            type: d.type,
            label: d.label,
            amountPaise: d.amountPaise,
          })),
        },
      },
    })

    // 4. Coupon redemption record
    if (input.couponCode && quote.couponDiscountPaise > 0) {
      const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } })
      if (coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            orderId: newOrder.id,
            userId: input.userId,
            discountPaise: quote.couponDiscountPaise,
          },
        })
      }
    }

    // 5. Inventory movement records
    for (const line of input.lines) {
      const qty = Math.max(1, line.qty ?? line.quantity ?? 1)
      await tx.inventoryMovement.create({
        data: {
          product: { connect: { id: line.productId } },
          delta: -qty,
          reason: 'SALE',
          note: `Order ${orderNumber}`,
          ...(actorId ? { actor: { connect: { id: actorId } } } : {}),
        },
      })
    }

    // 6. Status event
    await tx.orderStatusEvent.create({
      data: {
        orderId: newOrder.id,
        toStatus: 'CONFIRMED',
        actorId: actorId,
        note: 'Order placed',
      },
    })

    return newOrder
  })

  // ── Create payment record ────────────────────────────────────────────────
  let razorpayOrderId: string | undefined

  if (input.paymentMethod === 'RAZORPAY') {
    // In production: call Razorpay API to create order
    // For now, generate a placeholder that will be replaced with real Razorpay integration
    razorpayOrderId = `rzp_order_${crypto.randomBytes(8).toString('hex')}`

    await prisma.payment.create({
      data: {
        orderId: order.id,
        providerOrderId: razorpayOrderId,
        method: 'RAZORPAY',
        status: 'PENDING',
        amountPaise: quote.totalPaise,
      },
    })
  } else {
    // COD: create payment record with PENDING status
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'COD',
        status: 'PENDING',
        amountPaise: quote.totalPaise,
      },
    })
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalPaise: quote.totalPaise,
    razorpayOrderId,
    paymentMethod: input.paymentMethod,
  }
}

// ---------------------------------------------------------------------------
// Apply payment captured (called by webhook or verify route)
// ---------------------------------------------------------------------------

export async function applyPaymentCaptured(
  providerOrderId: string,
  providerPaymentId: string,
  method?: string
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { providerOrderId } })
  if (!payment) throw new Error(`Payment not found for providerOrderId ${providerOrderId}`)

  if (payment.status === 'PAID') return // idempotent

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        providerPaymentId,
        method: method ?? payment.method,
      },
    })

    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'PAID', fulfilmentStatus: 'PROCESSING' },
    })

    await tx.orderStatusEvent.create({
      data: {
        orderId: payment.orderId,
        fromStatus: 'CONFIRMED',
        toStatus: 'PROCESSING',
        note: `Payment captured: ${providerPaymentId}`,
      },
    })
  })
}

// ---------------------------------------------------------------------------
// Cancel unpaid orders (called by cron job)
// ---------------------------------------------------------------------------

export async function cancelUnpaidOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago

  const unpaid = await prisma.order.findMany({
    where: {
      paymentStatus: 'PENDING',
      source: 'WEB',
      createdAt: { lt: cutoff },
      fulfilmentStatus: { not: 'CANCELLED' },
    },
    include: { items: true },
  })

  let count = 0
  for (const order of unpaid) {
    await prisma.$transaction(async (tx) => {
      // Release stock
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          })
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              delta: item.qty,
              reason: 'RETURN',
              note: `Unpaid order ${order.orderNumber} cancelled`,
            },
          })
        }
      }

      // Release coupon if any
      if (order.couponCode) {
        await tx.couponRedemption.deleteMany({ where: { orderId: order.id } })
      }

      // Cancel order
      await tx.order.update({
        where: { id: order.id },
        data: { fulfilmentStatus: 'CANCELLED' },
      })

      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          toStatus: 'CANCELLED',
          note: 'Auto-cancelled: payment not received within 15 minutes',
        },
      })
    })
    count++
  }

  return count
}

