import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma.server'
import { AdminActionError, assertSuperadminAccess } from './admin-access'
import { adminAuditActions, type AdminAuditAction } from './admin-audit'

const activationLifetimeMs = 48 * 60 * 60 * 1000

export { AdminActionError } from './admin-access'

export async function requireActiveSuperadmin(userId: string | null) {
  return assertSuperadminAccess(userId, async (id) => prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } }))
}

function newActivationToken() {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  return { token, tokenHash, expiresAt: new Date(Date.now() + activationLifetimeMs) }
}

function activationUrl(token: string) {
  const origin = process.env.BETTER_AUTH_URL
  if (!origin) throw new Error('BETTER_AUTH_URL is required for admin activation')
  return `${new URL('/activate', origin).toString()}#token=${encodeURIComponent(token)}`
}

async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${userId} FOR UPDATE`
}

function auditAction(action: AdminAuditAction) {
  return action satisfies keyof typeof adminAuditActions
}

export async function listAdmins(actorId: string) {
  await requireActiveSuperadmin(actorId)
  const [admins, audits] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true, name: true, email: true, isActive: true, activatedAt: true, createdAt: true,
        adminActivation: { select: { expiresAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminAudit.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ])
  const people = await prisma.user.findMany({
    where: { id: { in: [...new Set(audits.flatMap((audit) => [audit.actorId, audit.targetId]))] } },
    select: { id: true, name: true, email: true },
  })
  const names = new Map(people.map((person) => [person.id, `${person.name} (${person.email})`]))
  return { admins, audits: audits.map((audit) => ({ ...audit, actorName: names.get(audit.actorId) ?? 'Akun tidak ditemukan', targetName: names.get(audit.targetId) ?? 'Akun tidak ditemukan' })) }
}

export async function createAdminAccount(actorId: string, input: { name: string; email: string }) {
  await requireActiveSuperadmin(actorId)
  const activation = newActivationToken()
  const link = activationUrl(activation.token)
  const userId = randomUUID()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          role: 'ADMIN',
          isActive: false,
          emailVerified: false,
        },
      })
      await tx.adminActivation.create({
        data: { id: randomUUID(), userId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt },
      })
      await tx.adminAudit.create({
        data: { id: randomUUID(), actorId, targetId: userId, action: auditAction('CREATE') },
      })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AdminActionError('DUPLICATE')
    }
    throw error
  }
  return { userId, activationUrl: link, expiresAt: activation.expiresAt }
}

export async function reissueAdminActivation(actorId: string, targetId: string) {
  await requireActiveSuperadmin(actorId)
  const activation = newActivationToken()
  const link = activationUrl(activation.token)
  await prisma.$transaction(async (tx) => {
    await lockUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, activatedAt: true } })
    if (target?.role !== 'ADMIN') throw new AdminActionError('NOT_FOUND')
    if (target.activatedAt) throw new AdminActionError('ALREADY_ACTIVATED')
    await tx.adminActivation.upsert({
      where: { userId: targetId },
      update: { tokenHash: activation.tokenHash, expiresAt: activation.expiresAt },
      create: { id: randomUUID(), userId: targetId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt },
    })
    await tx.adminAudit.create({ data: { id: randomUUID(), actorId, targetId, action: auditAction('REISSUE_ACTIVATION') } })
  })
  return { activationUrl: link, expiresAt: activation.expiresAt }
}

export async function setAdminActive(actorId: string, targetId: string, active: boolean) {
  await requireActiveSuperadmin(actorId)
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, isActive: true, activatedAt: true } })
    if (target?.role !== 'ADMIN') throw new AdminActionError('NOT_FOUND')
    if (active && !target.activatedAt) throw new AdminActionError('NOT_ACTIVATED')
    if (target.isActive === active && (active || target.activatedAt)) return { changed: false }
    await tx.user.update({ where: { id: targetId }, data: { isActive: active } })
    if (!active) {
      await tx.session.deleteMany({ where: { userId: targetId } })
      await tx.adminActivation.deleteMany({ where: { userId: targetId } })
    }
    await tx.adminAudit.create({
      data: { id: randomUUID(), actorId, targetId, action: auditAction(active ? 'ACTIVATE' : 'DEACTIVATE') },
    })
    return { changed: true }
  })
}

export async function activateAdminAccount(token: string, password: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const existing = await prisma.adminActivation.findUnique({ where: { tokenHash }, select: { userId: true, expiresAt: true } })
  if (!existing || existing.expiresAt <= new Date()) throw new AdminActionError('INVALID_TOKEN')
  const passwordHash = await hashPassword(password)
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, existing.userId)
    const activation = await tx.adminActivation.findUnique({
      where: { tokenHash },
      include: { user: { select: { role: true, activatedAt: true } } },
    })
    if (!activation || activation.expiresAt <= new Date() || activation.user.role !== 'ADMIN' || activation.user.activatedAt) {
      throw new AdminActionError('INVALID_TOKEN')
    }
    const claimed = await tx.adminActivation.deleteMany({ where: { id: activation.id, tokenHash, expiresAt: { gt: new Date() } } })
    if (claimed.count !== 1) throw new AdminActionError('INVALID_TOKEN')
    await tx.account.create({
      data: { id: randomUUID(), accountId: activation.userId, providerId: 'credential', userId: activation.userId, password: passwordHash },
    })
    await tx.user.update({ where: { id: activation.userId }, data: { isActive: true, activatedAt: new Date() } })
    await tx.adminAudit.create({ data: { id: randomUUID(), actorId: activation.userId, targetId: activation.userId, action: auditAction('COMPLETE_ACTIVATION') } })
    return { activated: true }
  })
}
