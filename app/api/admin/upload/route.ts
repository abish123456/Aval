import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import crypto from 'crypto'
import path from 'path'
import { ok, apiError } from '@/src/server/api/helpers'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'

// ---------------------------------------------------------------------------
// POST /api/admin/upload — product images only.
// The file type is decided from its first bytes, never from its name, so an
// .html or .svg can't be smuggled in and served from our own domain.
//
// Note: files are written to public/uploads on local disk. On serverless hosts
// that disk is not persistent — move to Supabase Storage before deploying there.
// ---------------------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function detectImageType(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'products:write')

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Images must be under 5 MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const type = detectImageType(buffer)
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG or WebP images are allowed' },
        { status: 400 }
      )
    }

    // Name: cleaned original base + random suffix + extension from the real type
    const cleanBase =
      path
        .basename(file.name, path.extname(file.name))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 30) || 'image'
    const filename = `${cleanBase}-${crypto.randomBytes(6).toString('hex')}.${type}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    return ok({ url: `/uploads/${filename}`, filename })
  } catch (error) {
    return apiError(error)
  }
}
