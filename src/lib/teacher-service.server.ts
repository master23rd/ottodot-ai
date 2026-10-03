import { prisma } from './prisma.server'
import { teacherAccountAuditActions } from './admin-audit'
import { TeacherActionError } from './teacher-access'
import { activateOperatorAccount, createOperatorAccount, reissueOperatorActivation, requireActiveOperatorAdmin, setOperatorActive } from './operator-account-service.server'

const failure = (code: ConstructorParameters<typeof TeacherActionError>[0]) => new TeacherActionError(code)

export function requireActiveAdmin(userId: string | null) {
  return requireActiveOperatorAdmin(userId, failure)
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
    prisma.adminAudit.findMany({ where: { action: { in: [...teacherAccountAuditActions] } }, orderBy: { createdAt: 'desc' }, take: 20 }),
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

export function createTeacherAccount(actorId: string, input: { name: string; email: string }) {
  return createOperatorAccount('TEACHER', actorId, input, failure)
}

export function reissueTeacherActivation(actorId: string, targetId: string) {
  return reissueOperatorActivation('TEACHER', actorId, targetId, failure)
}

export function setTeacherActive(actorId: string, targetId: string, active: boolean) {
  return setOperatorActive('TEACHER', actorId, targetId, active, failure)
}

export function activateTeacherAccount(token: string, password: string) {
  return activateOperatorAccount('TEACHER', token, password, failure)
}
