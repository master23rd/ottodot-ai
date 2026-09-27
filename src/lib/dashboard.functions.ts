import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth.server'
import { prisma } from './prisma.server'
import { resolveDashboardAccess } from './dashboard-access'

export const getSuperadminDashboard = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  return resolveDashboardAccess(session?.user.id ?? null, (id) => prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  }))
})
