import { redirect } from '@tanstack/react-router'
import { getMyWorkspace } from './admin.functions'

export async function requireTeacherWorkspace(
  loadWorkspace: () => Promise<Awaited<ReturnType<typeof getMyWorkspace>>> = getMyWorkspace,
) {
  const result = await loadWorkspace()
  if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
  if (result.status !== 'ok' || result.user.role !== 'TEACHER') throw redirect({ to: '/unauthorized' })
  return { user: result.user }
}
