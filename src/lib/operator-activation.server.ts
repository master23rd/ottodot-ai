import { createHash, randomBytes } from 'node:crypto'
import type { Prisma } from '@/generated/prisma/client'

const activationLifetimeMs = 48 * 60 * 60 * 1000

export function hashActivationToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function newActivationToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashActivationToken(token), expiresAt: new Date(Date.now() + activationLifetimeMs) }
}

export function operatorActivationUrl(role: 'admin' | 'teacher' | 'staff', token: string, origin = process.env.BETTER_AUTH_URL) {
  if (!origin) throw new Error('BETTER_AUTH_URL is required for operator activation')
  const path = role === 'admin' ? '/activate' : `/activate-${role}`
  return `${new URL(path, origin).toString()}#token=${encodeURIComponent(token)}`
}

export async function lockOperatorUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${userId} FOR UPDATE`
}
