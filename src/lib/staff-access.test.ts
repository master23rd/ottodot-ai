import { describe, expect, it, vi } from 'vitest'
import { assertAdminAccess, staffAccountStatus } from './staff-access'

describe('staff account authorization', () => {
  it('rejects anonymous users without querying the database', async () => {
    const findUser = vi.fn(async () => ({ role: 'ADMIN', isActive: true }))
    await expect(assertAdminAccess(null, findUser)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(findUser).not.toHaveBeenCalled()
  })

  it('allows active admins only', async () => {
    for (const role of ['SUPERADMIN', 'STAFF', 'STAFF', 'MEMBER']) {
      await expect(assertAdminAccess('actor', async () => ({ role, isActive: true }))).rejects.toMatchObject({ code: 'FORBIDDEN' })
    }
    await expect(assertAdminAccess('actor', async () => ({ role: 'ADMIN', isActive: false }))).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(assertAdminAccess('actor', async () => ({ role: 'ADMIN', isActive: true }))).resolves.toBe('actor')
  })
})

describe('staff account status', () => {
  it('distinguishes activation, delivery failure, and deactivation', () => {
    const pending = { isActive: false, activatedAt: null, staffActivation: { expiresAt: new Date('2030-01-01'), deliveryStatus: 'SENT' } }
    expect(staffAccountStatus(pending, new Date('2029-01-01'))).toBe('Menunggu aktivasi')
    expect(staffAccountStatus({ ...pending, staffActivation: { ...pending.staffActivation, deliveryStatus: 'FAILED' } }, new Date('2029-01-01'))).toBe('Email gagal dikirim')
    expect(staffAccountStatus(pending, new Date('2031-01-01'))).toBe('Tautan kedaluwarsa')
    expect(staffAccountStatus({ ...pending, activatedAt: new Date('2029-01-01') }, new Date('2029-01-02'))).toBe('Nonaktif')
    expect(staffAccountStatus({ ...pending, activatedAt: new Date('2029-01-01'), isActive: true }, new Date('2029-01-02'))).toBe('Aktif')
  })
})
