import { z } from 'zod'
import { prisma } from '@/lib/db'

// Shared product validation and slug helpers for the admin product APIs.

const list = (max: number) => z.array(z.string().trim().min(1).max(max)).max(30)

export const productFields = {
  name: z.string().trim().min(2, 'Enter a product name').max(120),
  categoryId: z.string().min(1, 'Choose a category'),
  regularPricePaise: z.number().int().positive('Enter the regular price').max(100_000_000),
  salePricePaise: z.number().int().positive('Enter the selling price').max(100_000_000),
  customisable: z.boolean(),
  isBestSeller: z.boolean(),
  isNew: z.boolean(),
  description: z.string().trim().max(4000),
  details: list(200),
  images: z.array(z.string().trim().min(1).max(500)).min(1, 'Add at least one photo').max(12),
  sizes: list(40),
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'product'
}

/** First free slug: name, name-2, name-3… */
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const taken = new Set(
    (
      await prisma.product.findMany({
        where: { slug: { startsWith: base }, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { slug: true },
      })
    ).map((p) => p.slug)
  )
  if (!taken.has(base)) return base
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`
}

