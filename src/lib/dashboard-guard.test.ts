import { describe, expect, it, vi } from 'vitest'
import { requireSuperadminDashboard } from './dashboard-guard'

vi.mock('./dashboard.functions', () => ({ getSuperadminDashboard: vi.fn() }))

const user = { id: '1', name: 'Owner', email: 'owner@example.com', role: 'SUPERADMIN', isActive: true }

describe('dashboard route guard', () => {
  it('sends anonymous users to login', async () => {
    await expect(requireSuperadminDashboard(async () => ({ status: 'unauthenticated' })))
      .rejects.toMatchObject({ options: { to: '/login' } })
  })

  it('sends other roles to the unauthorized page', async () => {
    await expect(requireSuperadminDashboard(async () => ({ status: 'forbidden' })))
      .rejects.toMatchObject({ options: { to: '/unauthorized' } })
  })

  it('passes the verified superadmin to the route', async () => {
    await expect(requireSuperadminDashboard(async () => ({ status: 'ok', user })))
      .resolves.toEqual({ user })
  })
})
