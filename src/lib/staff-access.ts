export class StaffActionError extends Error {
  constructor(public code: 'FORBIDDEN' | 'DUPLICATE' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'NOT_ACTIVATED' | 'ALREADY_ACTIVATED') {
    super(code)
  }
}

export async function assertAdminAccess(
  userId: string | null,
  findUser: (id: string) => Promise<{ role: string; isActive: boolean } | null>,
) {
  if (!userId) throw new StaffActionError('FORBIDDEN')
  const actor = await findUser(userId)
  if (actor?.role !== 'ADMIN' || !actor.isActive) throw new StaffActionError('FORBIDDEN')
  return userId
}

export function staffAccountStatus(
  staff: { isActive: boolean; activatedAt: Date | null; staffActivation: { expiresAt: Date; deliveryStatus: string } | null },
  now = new Date(),
) {
  if (staff.activatedAt) return staff.isActive ? 'Aktif' : 'Nonaktif'
  if (!staff.staffActivation) return 'Nonaktif'
  if (staff.staffActivation.deliveryStatus === 'FAILED') return 'Email gagal dikirim'
  if (new Date(staff.staffActivation.expiresAt) <= now) return 'Tautan kedaluwarsa'
  return staff.staffActivation.deliveryStatus === 'SENT' ? 'Menunggu aktivasi' : 'Menunggu pengiriman'
}
