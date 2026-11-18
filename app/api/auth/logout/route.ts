import { POST_logout } from '@/src/server/auth/handlers'

export async function POST() {
  return POST_logout()
}

