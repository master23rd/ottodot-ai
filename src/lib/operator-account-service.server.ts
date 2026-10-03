import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma.server'
import { sendStaffActivationEmail, sendTeacherActivationEmail } from './mail.server'
import { hashActivationToken, lockOperatorUser, newActivationToken, operatorActivationUrl } from './operator-activation.server'
import { assertOperatorAdminAccess } from './operator-account-access'

type ManagedRole = 'TEACHER' | 'STAFF'
type ActionErrorCode = 'FORBIDDEN' | 'DUPLICATE' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'NOT_ACTIVATED' | 'ALREADY_ACTIVATED'
type ErrorFactory = (code: ActionErrorCode) => Error

const roles = {
  TEACHER: {
    urlRole: 'teacher', sendEmail: sendTeacherActivationEmail,
    create: 'CREATE_TEACHER', delivery: 'SEND_TEACHER_ACTIVATION_EMAIL', reissue: 'REISSUE_TEACHER_ACTIVATION',
    activate: 'ACTIVATE_TEACHER', deactivate: 'DEACTIVATE_TEACHER', complete: 'COMPLETE_TEACHER_ACTIVATION',
  },
  STAFF: {
    urlRole: 'staff', sendEmail: sendStaffActivationEmail,
    create: 'CREATE_STAFF', delivery: 'SEND_STAFF_ACTIVATION_EMAIL', reissue: 'REISSUE_STAFF_ACTIVATION',
    activate: 'ACTIVATE_STAFF', deactivate: 'DEACTIVATE_STAFF', complete: 'COMPLETE_STAFF_ACTIVATION',
  },
} as const

export async function requireActiveOperatorAdmin(userId: string | null, failure: ErrorFactory) {
  return assertOperatorAdminAccess(
    userId,
    (id) => prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } }),
    failure,
  )
}

async function deliverActivation(role: ManagedRole, input: {
  actorId: string; userId: string; email: string; name: string; token: string; tokenHash: string
}) {
  const config = roles[role]
  let emailSent = false
  try {
    await config.sendEmail({ to: input.email, name: input.name, activationUrl: operatorActivationUrl(config.urlRole, input.token) })
    emailSent = true
  } catch {
    // Keep the pending account visible so the admin can retry delivery.
  }
  await prisma.$transaction(async (tx) => {
    const where = { userId: input.userId, tokenHash: input.tokenHash }
    const data = { deliveryStatus: emailSent ? 'SENT' : 'FAILED', deliveryAttemptedAt: new Date() }
    const updated = role === 'TEACHER'
      ? await tx.teacherActivation.updateMany({ where, data })
      : await tx.staffActivation.updateMany({ where, data })
    if (updated.count === 1) await tx.adminAudit.create({
      data: { id: randomUUID(), actorId: input.actorId, targetId: input.userId, action: config.delivery, result: emailSent ? 'SUCCESS' : 'FAILED' },
    })
  })
  return { emailSent }
}

export async function createOperatorAccount(role: ManagedRole, actorId: string, input: { name: string; email: string }, failure: ErrorFactory) {
  await requireActiveOperatorAdmin(actorId, failure)
  const activation = newActivationToken()
  operatorActivationUrl(roles[role].urlRole, activation.token)
  const userId = randomUUID()
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({ data: { id: userId, name, email, role, isActive: false, emailVerified: false } })
      const data = { id: randomUUID(), userId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt }
      if (role === 'TEACHER') await tx.teacherActivation.create({ data })
      else await tx.staffActivation.create({ data })
      await tx.adminAudit.create({ data: { id: randomUUID(), actorId, targetId: userId, action: roles[role].create } })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw failure('DUPLICATE')
    throw error
  }
  return { userId, expiresAt: activation.expiresAt, ...await deliverActivation(role, {
    actorId, userId, email, name, token: activation.token, tokenHash: activation.tokenHash,
  }) }
}

export async function reissueOperatorActivation(role: ManagedRole, actorId: string, targetId: string, failure: ErrorFactory) {
  await requireActiveOperatorAdmin(actorId, failure)
  const activation = newActivationToken()
  operatorActivationUrl(roles[role].urlRole, activation.token)
  const target = await prisma.$transaction(async (tx) => {
    await lockOperatorUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, activatedAt: true, name: true, email: true } })
    if (target?.role !== role) throw failure('NOT_FOUND')
    if (target.activatedAt) throw failure('ALREADY_ACTIVATED')
    const where = { userId: targetId }
    const update = { tokenHash: activation.tokenHash, expiresAt: activation.expiresAt, deliveryStatus: 'PENDING', deliveryAttemptedAt: null }
    const create = { id: randomUUID(), userId: targetId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt }
    if (role === 'TEACHER') await tx.teacherActivation.upsert({ where, update, create })
    else await tx.staffActivation.upsert({ where, update, create })
    await tx.adminAudit.create({ data: { id: randomUUID(), actorId, targetId, action: roles[role].reissue } })
    return target
  })
  return { expiresAt: activation.expiresAt, ...await deliverActivation(role, {
    actorId, userId: targetId, email: target.email, name: target.name, token: activation.token, tokenHash: activation.tokenHash,
  }) }
}

export async function setOperatorActive(role: ManagedRole, actorId: string, targetId: string, active: boolean, failure: ErrorFactory) {
  await requireActiveOperatorAdmin(actorId, failure)
  return prisma.$transaction(async (tx) => {
    await lockOperatorUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, isActive: true, activatedAt: true } })
    if (target?.role !== role) throw failure('NOT_FOUND')
    if (active && !target.activatedAt) throw failure('NOT_ACTIVATED')
    if (target.isActive === active && (active || target.activatedAt)) return { changed: false }
    await tx.user.update({ where: { id: targetId }, data: { isActive: active } })
    if (!active) {
      await tx.session.deleteMany({ where: { userId: targetId } })
      if (role === 'TEACHER') await tx.teacherActivation.deleteMany({ where: { userId: targetId } })
      else await tx.staffActivation.deleteMany({ where: { userId: targetId } })
    }
    await tx.adminAudit.create({
      data: { id: randomUUID(), actorId, targetId, action: active ? roles[role].activate : roles[role].deactivate },
    })
    return { changed: true }
  })
}

export async function activateOperatorAccount(role: ManagedRole, token: string, password: string, failure: ErrorFactory) {
  const tokenHash = hashActivationToken(token)
  const where = { tokenHash }
  const select = { userId: true, expiresAt: true } as const
  const existing = role === 'TEACHER'
    ? await prisma.teacherActivation.findUnique({ where, select })
    : await prisma.staffActivation.findUnique({ where, select })
  if (!existing || existing.expiresAt <= new Date()) throw failure('INVALID_TOKEN')
  const passwordHash = await hashPassword(password)
  return prisma.$transaction(async (tx) => {
    await lockOperatorUser(tx, existing.userId)
    const include = { user: { select: { role: true, activatedAt: true } } } as const
    const activation = role === 'TEACHER'
      ? await tx.teacherActivation.findUnique({ where, include })
      : await tx.staffActivation.findUnique({ where, include })
    if (!activation || activation.expiresAt <= new Date() || activation.user.role !== role || activation.user.activatedAt) {
      throw failure('INVALID_TOKEN')
    }
    const claim = { id: activation.id, tokenHash, expiresAt: { gt: new Date() } }
    const claimed = role === 'TEACHER'
      ? await tx.teacherActivation.deleteMany({ where: claim })
      : await tx.staffActivation.deleteMany({ where: claim })
    if (claimed.count !== 1) throw failure('INVALID_TOKEN')
    await tx.account.create({
      data: { id: randomUUID(), accountId: activation.userId, providerId: 'credential', userId: activation.userId, password: passwordHash },
    })
    await tx.user.update({ where: { id: activation.userId }, data: { isActive: true, activatedAt: new Date(), emailVerified: true } })
    await tx.adminAudit.create({
      data: { id: randomUUID(), actorId: activation.userId, targetId: activation.userId, action: roles[role].complete },
    })
    return { activated: true }
  })
}
