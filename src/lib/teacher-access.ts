import { assertOperatorAdminAccess, operatorAccountStatus } from './operator-account-access'

export class TeacherActionError extends Error {
  constructor(public code: 'FORBIDDEN' | 'DUPLICATE' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'NOT_ACTIVATED' | 'ALREADY_ACTIVATED') {
    super(code)
  }
}

export function assertAdminAccess(
  userId: string | null,
  findUser: (id: string) => Promise<{ role: string; isActive: boolean } | null>,
) {
  return assertOperatorAdminAccess(userId, findUser, (code) => new TeacherActionError(code))
}

export function teacherAccountStatus(
  teacher: { isActive: boolean; activatedAt: Date | null; teacherActivation: { expiresAt: Date; deliveryStatus: string } | null },
  now = new Date(),
) {
  return operatorAccountStatus({ ...teacher, activation: teacher.teacherActivation }, now)
}
