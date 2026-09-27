import { redirect } from '@tanstack/react-router'
import { getSuperadminDashboard } from './dashboard.functions'

export async function requireSuperadminDashboard(
  loadDashboard: () => Promise<Awaited<ReturnType<typeof getSuperadminDashboard>>> = getSuperadminDashboard,
) {
  const result = await loadDashboard()
  if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
  if (result.status === 'forbidden') throw redirect({ to: '/unauthorized' })
  return { user: result.user }
}
