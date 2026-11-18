import { NextRequest } from 'next/server'
import { POST_register } from '@/src/server/auth/handlers'

export async function POST(req: NextRequest) {
  return POST_register(req)
}

