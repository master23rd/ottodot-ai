import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { auth } from './auth.server'
import {
  activateStaffAccount, createStaffAccount, listStaffMembers, reissueStaffActivation,
  requireActiveAdmin, setStaffActive,
} from './staff-service.server'
import { StaffActionError } from './staff-access'

const staffInput = z.object({
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
  if (origin && (!expected || origin !== new URL(expected).origin)) throw new StaffActionError('FORBIDDEN')
}

function actionError(error: unknown): { ok: false; code: string } {
  if (error instanceof StaffActionError) return { ok: false, code: error.code }
  throw error
}

async function adminAction<T extends object>(action: (actorId: string) => Promise<T>) {
  try {
    requireSameOrigin()
    const actorId = await requireActiveAdmin(await sessionUserId())
    return { ok: true as const, ...await action(actorId) }
  } catch (error) { return actionError(error) }
}

export const getStaffManagement = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await sessionUserId()
  if (!userId) return { status: 'unauthenticated' as const }
  try {
    const data = await listStaffMembers(userId)
    return { status: 'ok' as const, ...data }
  } catch (error) {
    if (error instanceof StaffActionError && error.code === 'FORBIDDEN') return { status: 'forbidden' as const }
    throw error
  }
})

export const createStaff = createServerFn({ method: 'POST' })
  .validator(staffInput)
  .handler(async ({ data }) => adminAction((actorId) => createStaffAccount(actorId, data)))

export const reissueStaff = createServerFn({ method: 'POST' })
  .validator(targetInput)
  .handler(async ({ data }) => adminAction((actorId) => reissueStaffActivation(actorId, data.userId)))

export const changeStaffStatus = createServerFn({ method: 'POST' })
  .validator(statusInput)
  .handler(async ({ data }) => adminAction((actorId) => setStaffActive(actorId, data.userId, data.active)))

export const completeStaffActivation = createServerFn({ method: 'POST' })
  .validator(activateInput)
  .handler(async ({ data }) => {
    try {
      requireSameOrigin()
      return { ok: true as const, ...await activateStaffAccount(data.token, data.password) }
    } catch (error) { return actionError(error) }
  })
