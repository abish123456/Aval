import { NextRequest } from 'next/server'
import { POST_login } from '@/src/server/auth/handlers'

export async function POST(req: NextRequest) {
  return POST_login(req)
}

