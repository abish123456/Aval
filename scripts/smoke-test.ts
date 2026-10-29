import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'
import { priceCart, loadPricingSettings } from '../src/server/pricing/engine'
import { placeOrder } from '../src/server/orders/checkout'

async function runSmokeTests() {
  console.log('🌸 ===============================================')
  console.log('🌸 Starting AVAL Store Backend E2E Smoke Tests')
  console.log('🌸 ===============================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, title: string, details?: unknown) {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`)
      passed++
    } else {
      console.error(`  ❌ [FAIL] ${title}`)
      if (details) console.error('     Details:', details)
      failed++
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Database & Seed Data Verification
    // -------------------------------------------------------------------------
    console.log('📦 1. Verifying Database Seeding & Models in MySQL...')
    const categoryCount = await prisma.category.count()
    assert(categoryCount >= 5, `Categories seeded (found ${categoryCount})`)

    const productCount = await prisma.product.count()
    assert(productCount >= 6, `Products seeded (found ${productCount})`)

    const adminUser = await prisma.user.findUnique({
      where: { email: 'abishek@avalstore.in' },
    })
    assert(adminUser !== null && adminUser.role === 'OWNER', 'Admin user abishek@avalstore.in exists with OWNER role')

    const settings = await prisma.setting.findMany()
    assert(settings.length >= 4, `Store settings found (${settings.length} settings)`)

    // -------------------------------------------------------------------------
    // 2. Auth & Bcrypt Password Verification
    // -------------------------------------------------------------------------
    console.log('\n🔐 2. Verifying Bcrypt Password Verification...')
    if (adminUser) {
      const isPasswordValid = await bcrypt.compare('aval2026', adminUser.passwordHash)
      assert(isPasswordValid, 'Admin password "aval2026" verifies cleanly with bcrypt')

      const isBadPasswordInvalid = !(await bcrypt.compare('wrongpass', adminUser.passwordHash))
      assert(isBadPasswordInvalid, 'Invalid password correctly rejected')
    }

    // -------------------------------------------------------------------------
    // 3. Pricing Engine & Discount Calculation
    // -------------------------------------------------------------------------
    console.log('\n💰 3. Verifying Integer Paise Pricing Pipeline...')
    const sampleProduct = await prisma.product.findFirst({
      where: { archived: false, stock: { gt: 5 } },
    })
    assert(sampleProduct !== null, `Found available product: ${sampleProduct?.name}`)

    if (sampleProduct) {
      const pricingSettings = await loadPricingSettings()
      const expectedItemPrice = sampleProduct.salePricePaise ?? sampleProduct.regularPricePaise
      
      // Test without coupon
      const quoteNoCoupon = await priceCart(
        [{ productId: sampleProduct.id, qty: 1 }],
        undefined,
        pricingSettings
      )
      assert(quoteNoCoupon.subtotalPaise === expectedItemPrice, `Cart subtotal matches item price: ₹${quoteNoCoupon.subtotalPaise / 100}`)
      assert(quoteNoCoupon.taxPaise >= 0, `Tax computed in integer paise (${quoteNoCoupon.taxPaise})`)
      assert(
        quoteNoCoupon.totalPaise === quoteNoCoupon.subtotalPaise - quoteNoCoupon.couponDiscountPaise + quoteNoCoupon.shippingPaise,
        `Total formula matches subtotal - discount + shipping: ₹${quoteNoCoupon.totalPaise / 100}`
      )

      // Test with WED10 coupon
      const quoteWithCoupon = await priceCart(
        [{ productId: sampleProduct.id, qty: 1 }],
        'WED10',
        pricingSettings
      )
      assert(quoteWithCoupon.coupon?.code === 'WED10', 'Coupon WED10 applied successfully')
      assert(quoteWithCoupon.couponDiscountPaise > 0, `10% discount applied: ₹${quoteWithCoupon.couponDiscountPaise / 100}`)
    }

    // -------------------------------------------------------------------------
    // 4. Transactional Checkout & Stock Reservation
    // -------------------------------------------------------------------------
    console.log('\n🛒 4. Verifying Transactional Checkout & Stock Reservation...')
    if (sampleProduct) {
      const initialStock = sampleProduct.stock

      const quote = await priceCart(
        [{ productId: sampleProduct.id, quantity: 1 }],
        'WED10'
      )

      const checkoutResult = await placeOrder({
        lines: [{ productId: sampleProduct.id, quantity: 1 }],
        couponCode: 'WED10',
        guestName: 'Smoke Test Bride',
        guestEmail: 'smoketest@avalstore.in',
        guestPhone: '+919876543210',
        paymentMethod: 'COD',
        expectedTotalPaise: quote.totalPaise,
        notes: 'Integration test order',
      })

      assert(checkoutResult.orderNumber.startsWith('AVL-'), `Order placed with number: ${checkoutResult.orderNumber}`)
      assert(checkoutResult.totalPaise === quote.totalPaise, `Order total matches quote total: ${checkoutResult.totalPaise} paise`)

      // Check order in MySQL
      const savedOrder = await prisma.order.findUnique({
        where: { id: checkoutResult.orderId },
        include: { items: true, discounts: true, statusEvents: true },
      })
      assert(savedOrder !== null, 'Order record exists in MySQL')
      assert(savedOrder?.items.length === 1, 'Order has 1 order item')
      assert((savedOrder?.discounts.length ?? 0) >= 1, 'Order recorded discount')
      assert(Boolean(savedOrder?.statusEvents.some(e => e.toStatus === 'CONFIRMED')), 'Order recorded CONFIRMED event in audit history')

      // Check stock decremented
      const updatedProduct = await prisma.product.findUnique({
        where: { id: sampleProduct.id },
      })
      assert(
        updatedProduct?.stock === initialStock - 1,
        `Inventory properly decremented from ${initialStock} to ${updatedProduct?.stock}`
      )

      // -----------------------------------------------------------------------
      // 5. Order Tracking Query
      // -----------------------------------------------------------------------
      console.log('\n🔍 5. Verifying Order Tracking Lookup...')
      const trackedOrder = await prisma.order.findFirst({
        where: {
          orderNumber: checkoutResult.orderNumber,
          guestEmail: 'smoketest@avalstore.in',
        },
        include: { items: true, statusEvents: true },
      })
      assert(trackedOrder !== null, `Track-order successfully located order ${checkoutResult.orderNumber}`)

      // -----------------------------------------------------------------------
      // Cleanup the test order and restore product stock
      // -----------------------------------------------------------------------
      await prisma.orderDiscount.deleteMany({ where: { orderId: checkoutResult.orderId } })
      await prisma.orderStatusEvent.deleteMany({ where: { orderId: checkoutResult.orderId } })
      await prisma.payment.deleteMany({ where: { orderId: checkoutResult.orderId } })
      await prisma.couponRedemption.deleteMany({ where: { orderId: checkoutResult.orderId } })
      await prisma.inventoryMovement.deleteMany({ where: { note: `Order ${checkoutResult.orderNumber}` } })
      await prisma.orderItem.deleteMany({ where: { orderId: checkoutResult.orderId } })
      await prisma.order.delete({ where: { id: checkoutResult.orderId } })
      await prisma.product.update({
        where: { id: sampleProduct.id },
        data: { stock: initialStock },
      })
      console.log('   (Cleaned up test order & restored product stock)')
    }

    // -------------------------------------------------------------------------
    // 6. Custom Bridal Inquiry & Admin Quoting Workflow
    // -------------------------------------------------------------------------
    console.log('\n👑 6. Verifying Custom Bridal Inquiry & Quoting Lifecycle...')
    const customInquiry = await prisma.customOrder.create({
      data: {
        name: 'Meenakshi Smoke Test',
        email: 'meenakshi@example.com',
        phone: '+919444123456',
        weddingDate: '2026-12-15',
        budget: '₹10,000 - ₹20,000',
        occasion: 'Muhurtham',
        description: 'Traditional South Indian temple jewellery hair piece with kemp stones',
        status: 'PENDING',
      },
    })
    assert(customInquiry.id !== undefined, `Custom inquiry created: ${customInquiry.id}`)

    // Admin sends quote
    const quoteToken = 'smoke_quote_token_' + Date.now()
    const updatedCustomOrder = await prisma.customOrder.update({
      where: { id: customInquiry.id },
      data: {
        quotePricePaise: 1500000, // ₹15,000
        quoteToken,
        quoteNote: 'Handmade with brass base and authentic antique gold finish',
        quoteSentAt: new Date(),
        quoteExpiresAt: new Date(Date.now() + 7 * 86400 * 1000),
        status: 'QUOTE_SENT',
      },
    })
    assert(updatedCustomOrder.status === 'QUOTE_SENT', 'Custom inquiry transitioned to QUOTE_SENT')
    assert(updatedCustomOrder.quotePricePaise === 1500000, 'Quoted amount stored as ₹15,000 (1500000 paise)')

    // Customer opens quote by token
    const fetchedQuote = await prisma.customOrder.findUnique({
      where: { quoteToken },
    })
    assert(fetchedQuote !== null && fetchedQuote.name === 'Meenakshi Smoke Test', 'Quote token resolved correctly')

    // Cleanup custom inquiry
    await prisma.customOrder.delete({ where: { id: customInquiry.id } })
    console.log('   (Cleaned up test custom inquiry)')

    // -------------------------------------------------------------------------
    // 7. Product Review Moderation
    // -------------------------------------------------------------------------
    console.log('\n⭐ 7. Verifying Product Review & Rating System...')
    if (sampleProduct) {
      const review = await prisma.review.create({
        data: {
          productId: sampleProduct.id,
          guestName: 'Ananya S.',
          rating: 5,
          body: 'Wore this for my Muhurtham ceremony in Kanyakumari. Absolutely stunning quality.',
          visible: true,
        },
      })
      assert(review.rating === 5, 'Customer review saved with 5-star rating')

      // Recalculate product rating
      const reviews = await prisma.review.findMany({
        where: { productId: sampleProduct.id, visible: true },
        select: { rating: true },
      })
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      assert(avg >= 4.0, `Average product rating calculated: ${avg.toFixed(1)}/5 stars`)

      // Cleanup review
      await prisma.review.delete({ where: { id: review.id } })
      console.log('   (Cleaned up test review)')
    }

    console.log('\n===============================================')
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('===============================================\n')

    if (failed > 0) {
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

runSmokeTests().catch(err => {
  console.error('Smoke test crashed:', err)
  process.exit(1)
})
