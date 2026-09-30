export type DashboardUser = { id: string; name: string; email: string; role: string; isActive: boolean }

export async function resolveDashboardAccess(
  sessionUserId: string | null,
  findUser: (id: string) => Promise<DashboardUser | null>,
) {
  if (!sessionUserId) return { status: 'unauthenticated' as const }
  const user = await findUser(sessionUserId)
  if (!user || user.role !== 'SUPERADMIN' || !user.isActive) return { status: 'forbidden' as const }
  return { status: 'ok' as const, user }
}
