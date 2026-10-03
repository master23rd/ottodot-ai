type AccessErrorCode = 'FORBIDDEN'

export async function assertOperatorAdminAccess(
  userId: string | null,
  findUser: (id: string) => Promise<{ role: string; isActive: boolean } | null>,
  failure: (code: AccessErrorCode) => Error,
) {
  if (!userId) throw failure('FORBIDDEN')
  const actor = await findUser(userId)
  if (actor?.role !== 'ADMIN' || !actor.isActive) throw failure('FORBIDDEN')
  return userId
}

export function operatorAccountStatus(
  account: { isActive: boolean; activatedAt: Date | null; activation: { expiresAt: Date; deliveryStatus: string } | null },
  now = new Date(),
) {
  if (account.activatedAt) return account.isActive ? 'Aktif' : 'Nonaktif'
  if (!account.activation) return 'Nonaktif'
  if (account.activation.deliveryStatus === 'FAILED') return 'Email gagal dikirim'
  if (new Date(account.activation.expiresAt) <= now) return 'Tautan kedaluwarsa'
  return account.activation.deliveryStatus === 'SENT' ? 'Menunggu aktivasi' : 'Menunggu pengiriman'
}
