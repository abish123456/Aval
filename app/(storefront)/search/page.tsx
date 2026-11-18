import type { Metadata } from 'next'
import { listProducts } from '@/src/server/catalog'
import SearchView from './SearchView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage() {
  const products = await listProducts({ bestSellersFirst: true })
  return <SearchView products={products} />
}
