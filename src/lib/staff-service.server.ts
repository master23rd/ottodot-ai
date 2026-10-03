import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma.server'
import { assertAdminAccess, StaffActionError } from './staff-access'
import { staffAccountAuditActions } from './admin-audit'
import { sendStaffActivationEmail } from './mail.server'
import { hashActivationToken, lockOperatorUser, newActivationToken, operatorActivationUrl } from './operator-activation.server'
export async function requireActiveAdmin(userId: string | null) {
  return assertAdminAccess(userId, async (id) => prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } }))
}

export async function listStaffMembers(actorId: string) {
  await requireActiveAdmin(actorId)
  const [staffMembers, audits] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STAFF' },
      select: {
        id: true, name: true, email: true, isActive: true, activatedAt: true, createdAt: true,
        staffActivation: { select: { expiresAt: true, deliveryStatus: true, deliveryAttemptedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminAudit.findMany({ where: { action: { in: [...staffAccountAuditActions] } }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ])
  const people = await prisma.user.findMany({
    where: { id: { in: [...new Set(audits.flatMap((audit) => [audit.actorId, audit.targetId]))] } },
    select: { id: true, name: true, email: true },
  })
  const names = new Map(people.map((person) => [person.id, `${person.name} (${person.email})`]))
  return { staffMembers, audits: audits.map((audit) => ({
    ...audit, actorName: names.get(audit.actorId) ?? 'Akun tidak ditemukan', targetName: names.get(audit.targetId) ?? 'Akun tidak ditemukan',
  })) }
}

async function deliverStaffActivation(input: {
  actorId: string; userId: string; email: string; name: string; token: string; tokenHash: string
}) {
  let emailSent = false
  try {
    await sendStaffActivationEmail({ to: input.email, name: input.name, activationUrl: operatorActivationUrl('staff', input.token) })
    emailSent = true
  } catch {
    // The pending account stays visible so the admin can retry delivery.
  }
  await prisma.$transaction(async (tx) => {
    const updated = await tx.staffActivation.updateMany({
      where: { userId: input.userId, tokenHash: input.tokenHash },
      data: { deliveryStatus: emailSent ? 'SENT' : 'FAILED', deliveryAttemptedAt: new Date() },
    })
    if (updated.count === 1) await tx.adminAudit.create({
      data: {
        id: randomUUID(), actorId: input.actorId, targetId: input.userId,
        action: 'SEND_STAFF_ACTIVATION_EMAIL', result: emailSent ? 'SUCCESS' : 'FAILED',
      },
    })
  })
  return { emailSent }
}

export async function createStaffAccount(actorId: string, input: { name: string; email: string }) {
  await requireActiveAdmin(actorId)
  const activation = newActivationToken()
  operatorActivationUrl('staff', activation.token)
  const userId = randomUUID()
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({ data: { id: userId, name, email, role: 'STAFF', isActive: false, emailVerified: false } })
      await tx.staffActivation.create({
        data: { id: randomUUID(), userId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt },
      })
      await tx.adminAudit.create({ data: { id: randomUUID(), actorId, targetId: userId, action: 'CREATE_STAFF' } })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new StaffActionError('DUPLICATE')
    throw error
  }
  return { userId, expiresAt: activation.expiresAt, ...await deliverStaffActivation({
    actorId, userId, email, name, token: activation.token, tokenHash: activation.tokenHash,
  }) }
}

export async function reissueStaffActivation(actorId: string, targetId: string) {
  await requireActiveAdmin(actorId)
  const activation = newActivationToken()
  operatorActivationUrl('staff', activation.token)
  const target = await prisma.$transaction(async (tx) => {
    await lockOperatorUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, activatedAt: true, name: true, email: true } })
    if (target?.role !== 'STAFF') throw new StaffActionError('NOT_FOUND')
    if (target.activatedAt) throw new StaffActionError('ALREADY_ACTIVATED')
    await tx.staffActivation.upsert({
      where: { userId: targetId },
      update: { tokenHash: activation.tokenHash, expiresAt: activation.expiresAt, deliveryStatus: 'PENDING', deliveryAttemptedAt: null },
      create: { id: randomUUID(), userId: targetId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt },
    })
    await tx.adminAudit.create({ data: { id: randomUUID(), actorId, targetId, action: 'REISSUE_STAFF_ACTIVATION' } })
    return target
  })
  return { expiresAt: activation.expiresAt, ...await deliverStaffActivation({
    actorId, userId: targetId, email: target.email, name: target.name, token: activation.token, tokenHash: activation.tokenHash,
  }) }
}

export async function setStaffActive(actorId: string, targetId: string, active: boolean) {
  await requireActiveAdmin(actorId)
  return prisma.$transaction(async (tx) => {
    await lockOperatorUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, isActive: true, activatedAt: true } })
    if (target?.role !== 'STAFF') throw new StaffActionError('NOT_FOUND')
    if (active && !target.activatedAt) throw new StaffActionError('NOT_ACTIVATED')
    if (target.isActive === active && (active || target.activatedAt)) return { changed: false }
    await tx.user.update({ where: { id: targetId }, data: { isActive: active } })
    if (!active) {
      await tx.session.deleteMany({ where: { userId: targetId } })
      await tx.staffActivation.deleteMany({ where: { userId: targetId } })
    }
    await tx.adminAudit.create({
      data: { id: randomUUID(), actorId, targetId, action: active ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF' },
    })
    return { changed: true }
  })
}

export async function activateStaffAccount(token: string, password: string) {
  const tokenHash = hashActivationToken(token)
  const existing = await prisma.staffActivation.findUnique({ where: { tokenHash }, select: { userId: true, expiresAt: true } })
  if (!existing || existing.expiresAt <= new Date()) throw new StaffActionError('INVALID_TOKEN')
  const passwordHash = await hashPassword(password)
  return prisma.$transaction(async (tx) => {
    await lockOperatorUser(tx, existing.userId)
    const activation = await tx.staffActivation.findUnique({
      where: { tokenHash }, include: { user: { select: { role: true, activatedAt: true } } },
    })
    if (!activation || activation.expiresAt <= new Date() || activation.user.role !== 'STAFF' || activation.user.activatedAt) {
      throw new StaffActionError('INVALID_TOKEN')
    }
    const claimed = await tx.staffActivation.deleteMany({ where: { id: activation.id, tokenHash, expiresAt: { gt: new Date() } } })
    if (claimed.count !== 1) throw new StaffActionError('INVALID_TOKEN')
    await tx.account.create({
      data: { id: randomUUID(), accountId: activation.userId, providerId: 'credential', userId: activation.userId, password: passwordHash },
    })
    await tx.user.update({ where: { id: activation.userId }, data: { isActive: true, activatedAt: new Date(), emailVerified: true } })
    await tx.adminAudit.create({
      data: { id: randomUUID(), actorId: activation.userId, targetId: activation.userId, action: 'COMPLETE_STAFF_ACTIVATION' },
    })
    return { activated: true }
  })
}
