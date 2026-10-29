import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
  archived: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'categories:write')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

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
    if (session) {
      requirePermission(session.role, 'categories:write')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const { id } = await ctx.params
    await prisma.category.delete({ where: { id } })

    return ok({ deleted: true, id })
  } catch (error) {
    return apiError(error)
  }
}

