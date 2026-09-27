import { useState } from 'react'
import { Button } from '@mantine/core'
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { authClient } from '@/lib/auth-client'
import { getSuperadminDashboard } from '@/lib/dashboard.functions'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const result = await getSuperadminDashboard()
    if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
    if (result.status === 'forbidden') throw redirect({ to: '/unauthorized' })
    return { user: result.user }
  },
  component: Dashboard,
})

function Dashboard() {
  const { user } = Route.useRouteContext()
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()
  const router = useRouter()

  async function logout() {
    setPending(true)
    try {
      await authClient.signOut()
      await router.invalidate()
      await navigate({ to: '/login' })
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
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Superadmin</small></span></div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar"><span className="eyebrow">RUANG KERJA / RINGKASAN</span><Button variant="subtle" color="dark" loading={pending} onClick={logout}>Keluar</Button></header>
        <div className="dashboard-content">
          <div className="dashboard-heading"><p className="eyebrow">SUPERADMIN</p><h1>Selamat datang, {user.name}.</h1><p>Fondasi OttoDot sudah siap. Akun admin, kelas, dan pendaftaran akan hadir pada tahap berikutnya.</p></div>
          <section className="dashboard-grid" aria-label="Status ruang kerja">
            <article className="dashboard-panel"><span className="panel-icon">●</span><p>Status akun</p><strong>Aktif</strong><small>Akses tingkat platform</small></article>
            <article className="dashboard-panel"><span className="panel-icon">○</span><p>Admin</p><strong>Belum ada</strong><small>Buat akun admin pada tahap berikutnya</small></article>
            <article className="dashboard-panel"><span className="panel-icon">◌</span><p>Kelas</p><strong>Belum ada</strong><small>Paket kelas belum diterbitkan</small></article>
          </section>
          <section className="next-step"><div><p className="eyebrow">LANGKAH BERIKUTNYA</p><h2>Bangun tim OttoDot</h2><p>Setelah fitur pengelolaan admin tersedia, Anda dapat menugaskan pengajar dan menyiapkan kelas.</p></div><span aria-hidden="true">↗</span></section>
        </div>
      </main>
    </div>
  )
}
