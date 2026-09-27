import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashPassword } from 'better-auth/crypto'

export function readBootstrapConfig(env: NodeJS.ProcessEnv = process.env) {
  const databaseUrl = env.DATABASE_URL
  const email = env.SUPERADMIN_EMAIL?.trim().toLowerCase()
  const name = env.SUPERADMIN_NAME?.trim() || 'OttoDot Superadmin'
  const password = env.SUPERADMIN_PASSWORD
  const authSecret = env.BETTER_AUTH_SECRET

  if (!databaseUrl || !email || !password || !authSecret) {
    throw new Error('DATABASE_URL, BETTER_AUTH_SECRET, SUPERADMIN_EMAIL, and SUPERADMIN_PASSWORD are required')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('SUPERADMIN_EMAIL must be a valid email address')
  }
  if (password.length < 16 || password === 'replace-with-a-unique-strong-password') {
    throw new Error('SUPERADMIN_PASSWORD must be a unique password of at least 16 characters')
  }
  if (authSecret.length < 32 || authSecret === 'replace-with-at-least-32-random-characters') {
    throw new Error('BETTER_AUTH_SECRET must be a random secret of at least 32 characters')
  }
  return { databaseUrl, email, name, password }
}

export async function seedSuperadmin(config = readBootstrapConfig(), client?: PrismaClient) {
  const prisma = client ?? new PrismaClient({
    adapter: new PrismaPg({ connectionString: config.databaseUrl }),
  })

  try {
    const existing = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } })
    if (existing) {
      if (existing.email !== config.email) {
        throw new Error('A superadmin already exists with a different email; seed will not create another')
      }
      return { created: false, userId: existing.id }
    }

    const passwordHash = await hashPassword(config.password)
    const userId = randomUUID()
    try {
      await prisma.$transaction(async (transaction) => {
        await transaction.user.create({
          data: {
            id: userId,
            email: config.email,
            name: config.name,
            role: 'SUPERADMIN',
            emailVerified: true,
          },
        })
        await transaction.account.create({
          data: {
            id: randomUUID(),
            userId,
            accountId: userId,
            providerId: 'credential',
            password: passwordHash,
          },
        })
      })
    } catch (error) {
      // A second seeder may have won the race after the initial lookup.
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        const winner = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } })
        if (winner?.email === config.email) return { created: false, userId: winner.id }
      }
      throw error
    }
    return { created: true, userId }
  } finally {
    if (!client) await prisma.$disconnect()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  seedSuperadmin()
    .then(({ created }) => console.info(created ? 'Superadmin created' : 'Superadmin already exists'))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'Superadmin seed failed')
      process.exitCode = 1
    })
}
