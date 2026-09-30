import { useState } from 'react'
import { Alert, Button } from '@mantine/core'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { authClient } from '@/lib/auth-client'
import { requireSuperadminDashboard } from '@/lib/dashboard-guard'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => requireSuperadminDashboard(),
  component: Dashboard,
})

function Dashboard() {
  const { user } = Route.useRouteContext()
  const [pending, setPending] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const navigate = useNavigate()
  const router = useRouter()

  async function logout() {
    setLogoutError('')
    setPending(true)
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error('Sign out failed')
      await router.invalidate()
      await navigate({ to: '/login' })
    } catch {
      setLogoutError('Tidak dapat keluar sekarang. Coba lagi beberapa saat.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Brand />
        <div className="sidebar-label">RUANG KERJA</div>
        <div className="nav-current"><span aria-hidden="true">◫</span> Ringkasan</div>
        <Link className="nav-link" to="/admins">Akun admin</Link>
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Superadmin</small></span></div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar"><span className="eyebrow">RUANG KERJA / RINGKASAN</span><Button variant="subtle" color="dark" loading={pending} onClick={logout}>Keluar</Button></header>
        <div className="dashboard-content">
          {logoutError && <Alert color="red" role="alert">{logoutError}</Alert>}
          <div className="dashboard-heading"><p className="eyebrow">SUPERADMIN</p><h1>Selamat datang, {user.name}.</h1><p>Kelola akses admin yang membantu menjalankan OttoDot.</p></div>
          <section className="dashboard-grid" aria-label="Status ruang kerja">
            <article className="dashboard-panel"><span className="panel-icon">●</span><p>Status akun</p><strong>Aktif</strong><small>Akses tingkat platform</small></article>
            <Link className="dashboard-panel dashboard-panel-link" to="/admins"><span className="panel-icon">○</span><p>Admin</p><strong>Kelola akun</strong><small>Buat, aktivasi, dan atur akses admin</small></Link>
            <article className="dashboard-panel"><span className="panel-icon">◌</span><p>Kelas</p><strong>Belum ada</strong><small>Paket kelas belum diterbitkan</small></article>
          </section>
          <section className="next-step"><div><p className="eyebrow">LANGKAH BERIKUTNYA</p><h2>Bangun tim OttoDot</h2><p>Mulai dengan membuat akun admin. Mereka dapat mengaktifkan akun dan masuk ke ruang kerja sendiri.</p></div><Link className="text-link" to="/admins">Kelola admin ↗</Link></section>
        </div>
      </main>
    </div>
  )
}
