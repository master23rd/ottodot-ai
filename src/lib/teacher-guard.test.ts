import { describe, expect, it, vi } from 'vitest'
import { requireTeacherWorkspace } from './teacher-guard'

vi.mock('./admin.functions', () => ({ getMyWorkspace: vi.fn() }))

const user = { id: 'teacher-1', name: 'Guru', role: 'TEACHER', isActive: true, createdAt: new Date(), activatedAt: new Date() }

describe('teacher route guard', () => {
  it('redirects anonymous users to login', async () => {
    await expect(requireTeacherWorkspace(async () => ({ status: 'unauthenticated' })))
      .rejects.toMatchObject({ options: { to: '/login' } })
  })

  it('rejects other roles and inactive accounts', async () => {
    await expect(requireTeacherWorkspace(async () => ({ status: 'ok', user: { ...user, role: 'ADMIN' } })))
      .rejects.toMatchObject({ options: { to: '/unauthorized' } })
    await expect(requireTeacherWorkspace(async () => ({ status: 'forbidden' })))
      .rejects.toMatchObject({ options: { to: '/unauthorized' } })
  })

  it('allows a verified teacher', async () => {
    await expect(requireTeacherWorkspace(async () => ({ status: 'ok', user }))).resolves.toEqual({ user })
  })
})
