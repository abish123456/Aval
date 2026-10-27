import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'

export const metadata: Metadata = {
  title: {
    default: 'AVAL Store — Handcrafted Bridal Accessories',
    template: '%s | AVAL Store',
  },
  description:
    'Customised bangles, hair clips and wedding accessories, personalised with your names and colours. Handcrafted with love in Kanyakumari.',
  keywords: ['bridal accessories', 'bangles', 'hair clips', 'customised', 'wedding', 'kanyakumari'],
  openGraph: {
    title: 'AVAL Store — Handcrafted Bridal Accessories',
    description: 'Customised bangles, hair clips and wedding accessories, handcrafted in Kanyakumari.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
