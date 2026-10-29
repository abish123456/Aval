import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { ok, apiError } from '@/src/server/api/helpers'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (session) {
      requirePermission(session.role, 'products:write')
    } else if (process.env.NODE_ENV !== 'development') {
      throw new AuthError()
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate clean unique filename
    const ext = path.extname(file.name) || '.jpg'
    const cleanBase = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30)
    const filename = `${cleanBase}-${Date.now()}${ext}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadDir, filename)

    await writeFile(filePath, buffer)

    const url = `/uploads/${filename}`
    return ok({ url, filename })
  } catch (error) {
    return apiError(error)
  }
}

