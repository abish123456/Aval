import type { Metadata } from 'next'
import AnnouncementBar from '@/components/storefront/AnnouncementBar'
import Header from '@/components/storefront/Header'
import Footer from '@/components/storefront/Footer'
import MobileBottomNav from '@/components/storefront/MobileBottomNav'
import { listCategories, listPublicCoupons, couponHeadline, getStoreContact, DEFAULT_STORE_CONTACT } from '@/src/server/catalog'
import { StoreContactProvider } from '@/context/StoreContact'
import { loadPricingSettings } from '@/src/server/pricing/engine'

// Nav, banner and footer come from live data, so render per request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'AVAL Store — Handcrafted Bridal Accessories',
    template: '%s | AVAL Store',
  },
}

// Banner, nav and footer reflect live settings, categories and coupons.
async function loadChrome() {
  try {
    const [categories, pricing, coupons, contact] = await Promise.all([
      listCategories(),
      loadPricingSettings(),
      listPublicCoupons(),
      getStoreContact(),
    ])
    const threshold = Math.round(pricing.freeShippingThresholdPaise / 100)
    const parts = [
      threshold > 0 ? `Free shipping on orders of ₹${threshold.toLocaleString('en-IN')} and above` : null,
      coupons[0] ? `Use code ${coupons[0].code} for ${couponHeadline(coupons[0])}` : null,
    ].filter(Boolean)
    return {
      categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
      message: parts.join(' 🌸 '),
      contact,
    }
  } catch (err) {
    console.error('[storefront layout] failed to load chrome', err)
    return { categories: [], message: '', contact: DEFAULT_STORE_CONTACT }
  }
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { categories, message, contact } = await loadChrome()
  return (
    <StoreContactProvider value={contact}>
      {message && <AnnouncementBar message={message} />}
      <Header categories={categories} />
      <main className="storefront-main">{children}</main>
      <Footer categories={categories} />
      <MobileBottomNav />
    </StoreContactProvider>
  )
}
