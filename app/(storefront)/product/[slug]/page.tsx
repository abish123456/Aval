import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, listApprovedReviews } from '@/src/server/catalog'
import ProductDetail from './ProductDetail'

export const dynamic = 'force-dynamic' // prices and stock change from the admin panel

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { title: product.name, images: product.images.slice(0, 1) },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()
  const reviews = (await listApprovedReviews(product.id)).map((r) => ({
    ...r,
    date: r.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  }))
  return <ProductDetail product={product} reviews={reviews.map(({ createdAt: _c, ...rest }) => { void _c; return rest })} />
}
