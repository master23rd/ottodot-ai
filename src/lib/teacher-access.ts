export class TeacherActionError extends Error {
  constructor(public code: 'FORBIDDEN' | 'DUPLICATE' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'NOT_ACTIVATED' | 'ALREADY_ACTIVATED') {
    super(code)
  }
}

export async function assertAdminAccess(
  userId: string | null,
  findUser: (id: string) => Promise<{ role: string; isActive: boolean } | null>,
) {
  if (!userId) throw new TeacherActionError('FORBIDDEN')
  const actor = await findUser(userId)
  if (actor?.role !== 'ADMIN' || !actor.isActive) throw new TeacherActionError('FORBIDDEN')
  return userId
}

export function teacherAccountStatus(
  teacher: { isActive: boolean; activatedAt: Date | null; teacherActivation: { expiresAt: Date; deliveryStatus: string } | null },
  now = new Date(),
) {
  if (teacher.activatedAt) return teacher.isActive ? 'Aktif' : 'Nonaktif'
  if (!teacher.teacherActivation) return 'Nonaktif'
  if (teacher.teacherActivation.deliveryStatus === 'FAILED') return 'Email gagal dikirim'
  if (new Date(teacher.teacherActivation.expiresAt) <= now) return 'Tautan kedaluwarsa'
  return teacher.teacherActivation.deliveryStatus === 'SENT' ? 'Menunggu aktivasi' : 'Menunggu pengiriman'
}
