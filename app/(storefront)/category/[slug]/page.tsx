import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, listProducts } from '@/src/server/catalog'
import CategoryView from './CategoryView'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  return category
    ? { title: category.name, description: category.description.slice(0, 160) }
    : { title: 'Collection not found' }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()
  const products = await listProducts({ categorySlug: slug, bestSellersFirst: true })
  return <CategoryView category={category} products={products} />
}
