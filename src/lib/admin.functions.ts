import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { auth } from './auth.server'
import { prisma } from './prisma.server'
import {
  AdminActionError, activateAdminAccount, createAdminAccount, listAdmins,
  reissueAdminActivation, requireActiveSuperadmin, setAdminActive,
} from './admin-service.server'

const adminInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase().max(254),
})
const targetInput = z.object({ userId: z.uuid() })
const statusInput = targetInput.extend({ active: z.boolean() })
const activateInput = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: z.string().min(16).max(128),
})

async function sessionUserId() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  return session?.user.id ?? null
}

function requireSameOrigin() {
  const origin = getRequestHeaders().get('origin')
  const expected = process.env.BETTER_AUTH_URL
  if (origin && (!expected || origin !== new URL(expected).origin)) throw new AdminActionError('FORBIDDEN')
}

function actionError(error: unknown): { ok: false; code: string } {
  if (error instanceof AdminActionError) return { ok: false, code: error.code }
  throw error
}

export const getAdminManagement = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await sessionUserId()
  if (!userId) return { status: 'unauthenticated' as const }
  try {
    const data = await listAdmins(userId)
    return { status: 'ok' as const, ...data }
  } catch (error) {
    if (error instanceof AdminActionError && error.code === 'FORBIDDEN') return { status: 'forbidden' as const }
    throw error
  }
})

export const createAdmin = createServerFn({ method: 'POST' })
  .validator(adminInput)
  .handler(async ({ data }) => {
    try {
      requireSameOrigin()
      const actorId = await requireActiveSuperadmin(await sessionUserId())
      return { ok: true as const, ...await createAdminAccount(actorId, data) }
    } catch (error) { return actionError(error) }
  })

export const reissueActivation = createServerFn({ method: 'POST' })
  .validator(targetInput)
  .handler(async ({ data }) => {
    try {
      requireSameOrigin()
      const actorId = await requireActiveSuperadmin(await sessionUserId())
      return { ok: true as const, ...await reissueAdminActivation(actorId, data.userId) }
    } catch (error) { return actionError(error) }
  })

export const changeAdminStatus = createServerFn({ method: 'POST' })
  .validator(statusInput)
  .handler(async ({ data }) => {
    try {
      requireSameOrigin()
      const actorId = await requireActiveSuperadmin(await sessionUserId())
      return { ok: true as const, ...await setAdminActive(actorId, data.userId, data.active) }
    } catch (error) { return actionError(error) }
  })

export const completeAdminActivation = createServerFn({ method: 'POST' })
  .validator(activateInput)
  .handler(async ({ data }) => {
    try {
      requireSameOrigin()
      return { ok: true as const, ...await activateAdminAccount(data.token, data.password) }
    } catch (error) { return actionError(error) }
  })

export const getMyWorkspace = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await sessionUserId()
  if (!userId) return { status: 'unauthenticated' as const }
  const user = await prisma.user.findUnique({
    where: { id: userId }, select: { id: true, name: true, role: true, isActive: true },
  })
  if (!user?.isActive) return { status: 'forbidden' as const }
  if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') return { status: 'ok' as const, user }
  return { status: 'forbidden' as const }
})
