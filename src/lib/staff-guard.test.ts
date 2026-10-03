import { describe, expect, it, vi } from 'vitest'
import { requireStaffWorkspace } from './staff-guard'

vi.mock('./admin.functions', () => ({ getMyWorkspace: vi.fn() }))

const user = { id: 'staff-1', name: 'Guru', role: 'STAFF', isActive: true, createdAt: new Date(), activatedAt: new Date() }

describe('staff route guard', () => {
  it('redirects anonymous users to login', async () => {
    await expect(requireStaffWorkspace(async () => ({ status: 'unauthenticated' })))
      .rejects.toMatchObject({ options: { to: '/login' } })
  })

  it('rejects other roles and inactive accounts', async () => {
    await expect(requireStaffWorkspace(async () => ({ status: 'ok', user: { ...user, role: 'ADMIN' } })))
      .rejects.toMatchObject({ options: { to: '/unauthorized' } })
    await expect(requireStaffWorkspace(async () => ({ status: 'forbidden' })))
      .rejects.toMatchObject({ options: { to: '/unauthorized' } })
  })

  it('allows a verified staff', async () => {
    await expect(requireStaffWorkspace(async () => ({ status: 'ok', user }))).resolves.toEqual({ user })
  })
})
