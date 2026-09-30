import { describe, expect, it, vi } from 'vitest'
import { resolveDashboardAccess } from './dashboard-access'

const user = { id: 'user-1', name: 'Owner', email: 'owner@example.com', role: 'SUPERADMIN', isActive: true }

describe('superadmin dashboard access', () => {
  it('redirects anonymous users before querying the database', async () => {
    const findUser = vi.fn(async () => user)
    expect(await resolveDashboardAccess(null, findUser)).toEqual({ status: 'unauthenticated' })
    expect(findUser).not.toHaveBeenCalled()
  })

  it('rejects missing users and non-superadmin roles', async () => {
    expect(await resolveDashboardAccess(user.id, async () => null)).toEqual({ status: 'forbidden' })
    expect(await resolveDashboardAccess(user.id, async () => ({ ...user, role: 'ADMIN' })))
      .toEqual({ status: 'forbidden' })
  })

  it('allows the database superadmin', async () => {
    expect(await resolveDashboardAccess(user.id, async () => user))
      .toEqual({ status: 'ok', user })
  })
})
