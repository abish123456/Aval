import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

const updateCategorySchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name').max(80).optional(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes in the URL').max(80).optional(),
  image: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(1000).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  archived: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'categories:write')

    const { id } = await ctx.params
    const raw = await req.json()
    const body = updateCategorySchema.parse(raw)

    const updated = await prisma.category.update({
      where: { id },
      data: body,
    })

    return ok(updated)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'categories:write')

    const { id } = await ctx.params
    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `This category still has ${productCount} product${productCount === 1 ? '' : 's'} (including hidden ones). Move them to another category first, or hide the category instead.`,
        },
        { status: 409 }
      )
    }
    await prisma.category.delete({ where: { id } })

    return ok({ deleted: true, id })
  } catch (error) {
    return apiError(error)
  }
}

