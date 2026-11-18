import type { Metadata } from 'next'
import { listProducts, listCategories } from '@/src/server/catalog'
import ShopView from './ShopView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop All',
  description: 'Handcrafted bridal bangles, hair accessories and personalised wedding sets from Kanyakumari.',
}

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    listProducts({ bestSellersFirst: true }),
    listCategories(),
  ])
  return <ShopView products={products} categories={categories} />
}
