import type { Metadata } from 'next'
import AnnouncementBar from '@/components/storefront/AnnouncementBar'
import Header from '@/components/storefront/Header'
import Footer from '@/components/storefront/Footer'
import MobileBottomNav from '@/components/storefront/MobileBottomNav'

export const metadata: Metadata = {
  title: {
    default: 'AVAL Store — Handcrafted Bridal Accessories',
    template: '%s | AVAL Store',
  },
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AnnouncementBar message="Free shipping on orders above ₹1,500 🌸 Use code WED10 for 10% off your first order" />
      <Header />
      <main className="storefront-main">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  )
}
