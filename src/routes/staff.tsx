import { useState } from 'react'
import { Alert, Button } from '@mantine/core'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { authClient } from '@/lib/auth-client'
import { requireStaffWorkspace } from '@/lib/staff-guard'

export const Route = createFileRoute('/staff')({
  beforeLoad: () => requireStaffWorkspace(),
  component: StaffWorkspace,
})

function StaffWorkspace() {
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
      <div className="nav-current">Ringkasan staff</div>
      <div className="sidebar-spacer" />
      <div className="sidebar-user"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Staff</small></span></div>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-topbar"><span className="eyebrow">RUANG KERJA / STAFF</span><Button variant="subtle" color="dark" loading={pending} onClick={logout}>Keluar</Button></header>
      <div className="dashboard-content">
        {error && <Alert color="red" role="alert">{error}</Alert>}
        <div className="dashboard-heading"><p className="eyebrow">TIM OPERASIONAL</p><h1>Selamat datang, {user.name}.</h1><p>Ruang kerja Anda siap digunakan.</p></div>
        <section className="dashboard-grid" aria-label="Status ruang kerja staff">
          <article className="dashboard-panel"><span className="panel-icon">●</span><p>Status akun</p><strong>Aktif</strong><small>Anda sudah dapat masuk ke OttoDot</small></article>
          <article className="dashboard-panel"><span className="panel-icon">○</span><p>Kelas ditugaskan</p><strong>Belum ada</strong><small>Admin akan menambahkan penugasan kelas</small></article>
          <article className="dashboard-panel"><span className="panel-icon">◌</span><p>Peran</p><strong>Staff</strong><small>Akses terbatas pada ruang staff</small></article>
        </section>
        <section className="next-step"><div><p className="eyebrow">PENUGASAN KELAS</p><h2>Belum ada kelas untuk Anda.</h2><p>Hubungi admin jika Anda sudah seharusnya menerima penugasan. Kelas yang ditugaskan akan tampil di ruang kerja ini pada tahap berikutnya.</p></div></section>
      </div>
    </main>
  </div>
}
