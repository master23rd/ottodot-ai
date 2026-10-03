import { assertOperatorAdminAccess, operatorAccountStatus } from './operator-account-access'

export class StaffActionError extends Error {
  constructor(public code: 'FORBIDDEN' | 'DUPLICATE' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'NOT_ACTIVATED' | 'ALREADY_ACTIVATED') {
    super(code)
  }
}

export function assertAdminAccess(
  userId: string | null,
  findUser: (id: string) => Promise<{ role: string; isActive: boolean } | null>,
) {
  return assertOperatorAdminAccess(userId, findUser, (code) => new StaffActionError(code))
}

export function staffAccountStatus(
  staff: { isActive: boolean; activatedAt: Date | null; staffActivation: { expiresAt: Date; deliveryStatus: string } | null },
  now = new Date(),
) {
  return operatorAccountStatus({ ...staff, activation: staff.staffActivation }, now)
}
