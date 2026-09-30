import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { APIError } from 'better-auth/api'
import { prisma } from './prisma.server'

if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be at least 32 characters')
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isActive: true } })
          if (!user?.isActive) {
            throw APIError.from('FORBIDDEN', { code: 'ACCOUNT_INACTIVE', message: 'Akun tidak aktif.' })
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ['SUPERADMIN', 'ADMIN', 'TEACHER', 'STAFF', 'MEMBER', 'CHILD'],
        input: false,
        required: false,
        defaultValue: 'MEMBER',
      },
    },
  },
  plugins: [tanstackStartCookies()],
})
