import { describe, expect, it, vi } from 'vitest'
import { assertSuperadminAccess } from './admin-access'

describe('admin management authorization', () => {
  it('rejects anonymous access before reading users', async () => {
    const findUser = vi.fn(async () => ({ role: 'SUPERADMIN', isActive: true }))
    await expect(assertSuperadminAccess(null, findUser)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(findUser).not.toHaveBeenCalled()
  })

  it('rejects admins and inactive superadmins', async () => {
    await expect(assertSuperadminAccess('admin-1', async () => ({ role: 'ADMIN', isActive: true }))).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(assertSuperadminAccess('super-1', async () => ({ role: 'SUPERADMIN', isActive: false }))).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('allows only an active superadmin', async () => {
    await expect(assertSuperadminAccess('super-1', async () => ({ role: 'SUPERADMIN', isActive: true }))).resolves.toBe('super-1')
  })
})
