import { describe, expect, it } from 'vitest'
import { requireSuperadminDashboard } from './dashboard-guard'

const user = { id: '1', name: 'Owner', email: 'owner@example.com', role: 'SUPERADMIN' }

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
