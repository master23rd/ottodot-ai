import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma.server'
import { assertAdminAccess, TeacherActionError } from './teacher-access'
import { adminAuditActions } from './admin-audit'
import { sendTeacherActivationEmail } from './mail.server'

const activationLifetimeMs = 48 * 60 * 60 * 1000
const teacherAuditActions = [
  'CREATE_TEACHER', 'SEND_TEACHER_ACTIVATION_EMAIL', 'REISSUE_TEACHER_ACTIVATION',
  'COMPLETE_TEACHER_ACTIVATION', 'ACTIVATE_TEACHER', 'DEACTIVATE_TEACHER',
] as const satisfies ReadonlyArray<keyof typeof adminAuditActions>

export async function requireActiveAdmin(userId: string | null) {
  return assertAdminAccess(userId, async (id) => prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } }))
}

function newActivationToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + activationLifetimeMs) }
}

function activationUrl(token: string) {
  const origin = process.env.BETTER_AUTH_URL
  if (!origin) throw new Error('BETTER_AUTH_URL is required for teacher activation')
  return `${new URL('/activate-teacher', origin).toString()}#token=${encodeURIComponent(token)}`
}

async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${userId} FOR UPDATE`
}

export async function listTeachers(actorId: string) {
  await requireActiveAdmin(actorId)
  const [teachers, audits] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: {
        id: true, name: true, email: true, isActive: true, activatedAt: true, createdAt: true,
        teacherActivation: { select: { expiresAt: true, deliveryStatus: true, deliveryAttemptedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminAudit.findMany({ where: { action: { in: [...teacherAuditActions] } }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ])
  const people = await prisma.user.findMany({
    where: { id: { in: [...new Set(audits.flatMap((audit) => [audit.actorId, audit.targetId]))] } },
    select: { id: true, name: true, email: true },
  })
  const names = new Map(people.map((person) => [person.id, `${person.name} (${person.email})`]))
  return { teachers, audits: audits.map((audit) => ({
    ...audit, actorName: names.get(audit.actorId) ?? 'Akun tidak ditemukan', targetName: names.get(audit.targetId) ?? 'Akun tidak ditemukan',
  })) }
}

async function deliverTeacherActivation(input: {
  actorId: string; userId: string; email: string; name: string; token: string; tokenHash: string
}) {
  let emailSent = false
  try {
    await sendTeacherActivationEmail({ to: input.email, name: input.name, activationUrl: activationUrl(input.token) })
    emailSent = true
  } catch {
    // The pending account stays visible so the admin can retry delivery.
  }
  await prisma.$transaction(async (tx) => {
    const updated = await tx.teacherActivation.updateMany({
      where: { userId: input.userId, tokenHash: input.tokenHash },
      data: { deliveryStatus: emailSent ? 'SENT' : 'FAILED', deliveryAttemptedAt: new Date() },
    })
    if (updated.count === 1) await tx.adminAudit.create({
      data: {
        id: randomUUID(), actorId: input.actorId, targetId: input.userId,
        action: 'SEND_TEACHER_ACTIVATION_EMAIL', result: emailSent ? 'SUCCESS' : 'FAILED',
      },
    })
  })
  return { emailSent }
}

export async function createTeacherAccount(actorId: string, input: { name: string; email: string }) {
  await requireActiveAdmin(actorId)
  const activation = newActivationToken()
  activationUrl(activation.token)
  const userId = randomUUID()
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({ data: { id: userId, name, email, role: 'TEACHER', isActive: false, emailVerified: false } })
      await tx.teacherActivation.create({
        data: { id: randomUUID(), userId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt },
      })
      await tx.adminAudit.create({ data: { id: randomUUID(), actorId, targetId: userId, action: 'CREATE_TEACHER' } })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new TeacherActionError('DUPLICATE')
    throw error
  }
  return { userId, expiresAt: activation.expiresAt, ...await deliverTeacherActivation({
    actorId, userId, email, name, token: activation.token, tokenHash: activation.tokenHash,
  }) }
}

export async function reissueTeacherActivation(actorId: string, targetId: string) {
  await requireActiveAdmin(actorId)
  const activation = newActivationToken()
  activationUrl(activation.token)
  const target = await prisma.$transaction(async (tx) => {
    await lockUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, activatedAt: true, name: true, email: true } })
    if (target?.role !== 'TEACHER') throw new TeacherActionError('NOT_FOUND')
    if (target.activatedAt) throw new TeacherActionError('ALREADY_ACTIVATED')
    await tx.teacherActivation.upsert({
      where: { userId: targetId },
      update: { tokenHash: activation.tokenHash, expiresAt: activation.expiresAt, deliveryStatus: 'PENDING', deliveryAttemptedAt: null },
      create: { id: randomUUID(), userId: targetId, tokenHash: activation.tokenHash, expiresAt: activation.expiresAt },
    })
    await tx.adminAudit.create({ data: { id: randomUUID(), actorId, targetId, action: 'REISSUE_TEACHER_ACTIVATION' } })
    return target
  })
  return { expiresAt: activation.expiresAt, ...await deliverTeacherActivation({
    actorId, userId: targetId, email: target.email, name: target.name, token: activation.token, tokenHash: activation.tokenHash,
  }) }
}

export async function setTeacherActive(actorId: string, targetId: string, active: boolean) {
  await requireActiveAdmin(actorId)
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, targetId)
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true, isActive: true, activatedAt: true } })
    if (target?.role !== 'TEACHER') throw new TeacherActionError('NOT_FOUND')
    if (active && !target.activatedAt) throw new TeacherActionError('NOT_ACTIVATED')
    if (target.isActive === active && (active || target.activatedAt)) return { changed: false }
    await tx.user.update({ where: { id: targetId }, data: { isActive: active } })
    if (!active) {
      await tx.session.deleteMany({ where: { userId: targetId } })
      await tx.teacherActivation.deleteMany({ where: { userId: targetId } })
    }
    await tx.adminAudit.create({
      data: { id: randomUUID(), actorId, targetId, action: active ? 'ACTIVATE_TEACHER' : 'DEACTIVATE_TEACHER' },
    })
    return { changed: true }
  })
}

export async function activateTeacherAccount(token: string, password: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const existing = await prisma.teacherActivation.findUnique({ where: { tokenHash }, select: { userId: true, expiresAt: true } })
  if (!existing || existing.expiresAt <= new Date()) throw new TeacherActionError('INVALID_TOKEN')
  const passwordHash = await hashPassword(password)
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, existing.userId)
    const activation = await tx.teacherActivation.findUnique({
      where: { tokenHash }, include: { user: { select: { role: true, activatedAt: true } } },
    })
    if (!activation || activation.expiresAt <= new Date() || activation.user.role !== 'TEACHER' || activation.user.activatedAt) {
      throw new TeacherActionError('INVALID_TOKEN')
    }
    const claimed = await tx.teacherActivation.deleteMany({ where: { id: activation.id, tokenHash, expiresAt: { gt: new Date() } } })
    if (claimed.count !== 1) throw new TeacherActionError('INVALID_TOKEN')
    await tx.account.create({
      data: { id: randomUUID(), accountId: activation.userId, providerId: 'credential', userId: activation.userId, password: passwordHash },
    })
    await tx.user.update({ where: { id: activation.userId }, data: { isActive: true, activatedAt: new Date(), emailVerified: true } })
    await tx.adminAudit.create({
      data: { id: randomUUID(), actorId: activation.userId, targetId: activation.userId, action: 'COMPLETE_TEACHER_ACTIVATION' },
    })
    return { activated: true }
  })
}
