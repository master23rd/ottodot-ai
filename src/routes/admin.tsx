import { useState } from 'react'
import { Alert, Button } from '@mantine/core'
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { authClient } from '@/lib/auth-client'
import { getMyWorkspace } from '@/lib/admin.functions'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const result = await getMyWorkspace()
    if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
    if (result.status !== 'ok' || result.user.role !== 'ADMIN') throw redirect({ to: '/unauthorized' })
    return { user: result.user }
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const { user } = Route.useRouteContext()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const navigate = useNavigate()

  async function logout() {
    setError('')
    setPending(true)
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error('Sign out failed')
      await router.invalidate()
      await navigate({ to: '/login' })
    } catch { setError('Tidak dapat keluar sekarang. Coba lagi.') }
    finally { setPending(false) }
  }

  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Brand />
      <div className="sidebar-label">RUANG KERJA</div>
      <div className="nav-current">Ringkasan admin</div>
      <div className="sidebar-spacer" />
      <div className="sidebar-user"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Admin</small></span></div>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-topbar"><span className="eyebrow">RUANG KERJA / ADMIN</span><Button variant="subtle" color="dark" loading={pending} onClick={logout}>Keluar</Button></header>
      <div className="dashboard-content">
        {error && <Alert color="red" role="alert">{error}</Alert>}
        <div className="dashboard-heading"><p className="eyebrow">RINGKASAN AKSES</p><h1>Selamat datang, {user.name}.</h1><p>Ruang kerja operasional untuk akun admin Anda.</p></div>
        <section className="dashboard-grid" aria-label="Status akun admin">
          <article className="dashboard-panel"><span className="panel-icon">●</span><p>Status akun</p><strong>Aktif</strong><small>Sesi pribadi Anda dapat digunakan</small></article>
          <article className="dashboard-panel"><span className="panel-icon">○</span><p>Peran</p><strong>Admin</strong><small>Akses operator OttoDot</small></article>
          <article className="dashboard-panel"><span className="panel-icon">◌</span><p>Aktivasi</p><strong>{user.activatedAt ? new Date(user.activatedAt).toLocaleDateString('id-ID', { timeZone: 'UTC' }) : 'Belum tercatat'}</strong><small>Terdaftar sejak {new Date(user.createdAt).toLocaleDateString('id-ID', { timeZone: 'UTC' })}</small></article>
        </section>
        <section className="next-step"><div><p className="eyebrow">PENGELOLAAN KELAS</p><h2>Tahap berikutnya</h2><p>Pembuatan akun teacher/staff dan pengelolaan kelas akan ditambahkan pada pekerjaan berikutnya. Akses admin lain tetap dikelola oleh superadmin.</p></div></section>
      </div>
    </main>
  </div>
}
