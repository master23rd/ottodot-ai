export class AdminActionError extends Error {
  constructor(public code: 'FORBIDDEN' | 'DUPLICATE' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'NOT_ACTIVATED' | 'ALREADY_ACTIVATED') {
    super(code)
  }
}

export async function assertSuperadminAccess(
  userId: string | null,
  findUser: (id: string) => Promise<{ role: string; isActive: boolean } | null>,
) {
  if (!userId) throw new AdminActionError('FORBIDDEN')
  const actor = await findUser(userId)
  if (actor?.role !== 'SUPERADMIN' || !actor.isActive) throw new AdminActionError('FORBIDDEN')
  return userId
}
