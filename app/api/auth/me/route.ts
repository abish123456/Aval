import { GET_me } from '@/src/server/auth/handlers'

export async function GET() {
  return GET_me()
}

