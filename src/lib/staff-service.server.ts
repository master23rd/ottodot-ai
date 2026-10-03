import { prisma } from './prisma.server'
import { staffAccountAuditActions } from './admin-audit'
import { StaffActionError } from './staff-access'
import { activateOperatorAccount, createOperatorAccount, reissueOperatorActivation, requireActiveOperatorAdmin, setOperatorActive } from './operator-account-service.server'

const failure = (code: ConstructorParameters<typeof StaffActionError>[0]) => new StaffActionError(code)

export function requireActiveAdmin(userId: string | null) {
  return requireActiveOperatorAdmin(userId, failure)
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

export function createStaffAccount(actorId: string, input: { name: string; email: string }) {
  return createOperatorAccount('STAFF', actorId, input, failure)
}

export function reissueStaffActivation(actorId: string, targetId: string) {
  return reissueOperatorActivation('STAFF', actorId, targetId, failure)
}

export function setStaffActive(actorId: string, targetId: string, active: boolean) {
  return setOperatorActive('STAFF', actorId, targetId, active, failure)
}

export function activateStaffAccount(token: string, password: string) {
  return activateOperatorAccount('STAFF', token, password, failure)
}
