/**
 * Clean DB — removes ALL data, leaving empty tables.
 * Run: npx tsx scripts/clean-db.ts
 */
import { prisma } from '../lib/db'

async function main() {
  console.log('🗑  Cleaning database...')

  // Enquiry related (child first)
  await prisma.enquiryRating.deleteMany()
  console.log('  ✓ EnquiryRating cleared')
  await prisma.enquiryMessage.deleteMany()
  console.log('  ✓ EnquiryMessage cleared')
  await prisma.enquiry.deleteMany()
  console.log('  ✓ Enquiry cleared')

  // Order related
  await prisma.orderStatusEvent.deleteMany()
  console.log('  ✓ OrderStatusEvent cleared')
  await prisma.orderDiscount.deleteMany()
  console.log('  ✓ OrderDiscount cleared')
  await prisma.orderItem.deleteMany()
  console.log('  ✓ OrderItem cleared')

  // Payments / Refunds
  await prisma.refund.deleteMany()
  console.log('  ✓ Refund cleared')
  await prisma.payment.deleteMany()
  console.log('  ✓ Payment cleared')

  await prisma.order.deleteMany()
  console.log('  ✓ Order cleared')

  // Custom orders
  await prisma.customOrder.deleteMany()
  console.log('  ✓ CustomOrder cleared')

  // Reviews, wishlist, inventory
  await prisma.review.deleteMany()
  console.log('  ✓ Review cleared')
  await prisma.wishlist.deleteMany()
  console.log('  ✓ Wishlist cleared')
  await prisma.inventoryMovement.deleteMany()
  console.log('  ✓ InventoryMovement cleared')

  // Coupons
  await prisma.couponRedemption.deleteMany()
  console.log('  ✓ CouponRedemption cleared')
  await prisma.coupon.deleteMany()
  console.log('  ✓ Coupon cleared')
  await prisma.promotion.deleteMany()
  console.log('  ✓ Promotion cleared')

  // Catalogue
  await prisma.product.deleteMany()
  console.log('  ✓ Product cleared')
  await prisma.category.deleteMany()
  console.log('  ✓ Category cleared')

  // Auth
  await prisma.auditLog.deleteMany()
  console.log('  ✓ AuditLog cleared')
  await prisma.emailOutbox.deleteMany()
  console.log('  ✓ EmailOutbox cleared')
  await prisma.passwordResetToken.deleteMany()
  console.log('  ✓ PasswordResetToken cleared')
  await prisma.session.deleteMany()
  console.log('  ✓ Session cleared')
  await prisma.address.deleteMany()
  console.log('  ✓ Address cleared')
  await prisma.user.deleteMany()
  console.log('  ✓ User cleared')

  // Settings
  await prisma.setting.deleteMany()
  console.log('  ✓ Setting cleared')

  console.log('\n✅ Database is now empty.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

