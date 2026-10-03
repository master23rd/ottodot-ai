import { useState, type FormEvent } from 'react'
import { Alert, Button, TextInput } from '@mantine/core'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { changeAdminStatus, createAdmin, getAdminManagement, reissueActivation } from '@/lib/admin.functions'
import { adminAuditActions } from '@/lib/admin-audit'

export const Route = createFileRoute('/admins')({
  beforeLoad: async () => {
    const result = await getAdminManagement()
    if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
    if (result.status === 'forbidden') throw redirect({ to: '/unauthorized' })
    return result
  },
  component: AdminManagement,
})

type ActionCode = 'FORBIDDEN' | 'DUPLICATE' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'NOT_ACTIVATED' | 'ALREADY_ACTIVATED'

function messageFor(code: string) {
  const messages: Record<ActionCode, string> = {
    FORBIDDEN: 'Sesi Anda tidak memiliki izin. Masuk kembali sebagai superadmin.',
    DUPLICATE: 'Alamat email sudah digunakan. Gunakan email lain.',
    NOT_FOUND: 'Akun admin tidak ditemukan. Muat ulang daftar.',
    INVALID_TOKEN: 'Tautan aktivasi tidak berlaku lagi.',
    NOT_ACTIVATED: 'Admin harus menyelesaikan aktivasi sebelum dapat diaktifkan.',
    ALREADY_ACTIVATED: 'Akun ini sudah pernah diaktivasi.',
  }
  return messages[code as ActionCode] ?? 'Tindakan gagal. Coba lagi.'
}

function adminStatus(admin: { isActive: boolean; activatedAt: Date | null; adminActivation: { expiresAt: Date; deliveryStatus: string } | null }) {
  if (admin.activatedAt) return admin.isActive ? 'Aktif' : 'Nonaktif'
  if (!admin.adminActivation) return 'Nonaktif'
  if (admin.adminActivation.deliveryStatus === 'FAILED') return 'Email gagal dikirim'
  if (new Date(admin.adminActivation.expiresAt) <= new Date()) return 'Tautan kedaluwarsa'
  return admin.adminActivation.deliveryStatus === 'SENT' ? 'Menunggu aktivasi' : 'Menunggu pengiriman'
}

function AdminManagement() {
  const { admins, audits } = Route.useRouteContext()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setPending(true)
    try {
      const result = await createAdmin({ data: { name, email } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      setName('')
      setEmail('')
      if (result.emailSent) setNotice('Admin dibuat. Email aktivasi telah dikirim ke alamat admin.')
      else setError('Admin dibuat, tetapi email aktivasi gagal dikirim. Gunakan Kirim ulang email pada daftar admin.')
      await router.invalidate().catch(() => setError('Daftar belum diperbarui. Muat ulang halaman.'))
    } catch {
      setError('Akun belum dibuat. Periksa nama dan email, lalu coba lagi.')
    } finally { setPending(false) }
  }

  async function changeStatus(userId: string, active: boolean) {
    setBusyId(userId)
    setError('')
    setNotice('')
    try {
      const result = await changeAdminStatus({ data: { userId, active } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      setNotice(active ? 'Akun admin diaktifkan.' : 'Akun admin dinonaktifkan dan sesi lama dicabut.')
      await router.invalidate().catch(() => setError('Daftar belum diperbarui. Muat ulang halaman.'))
    } catch { setError('Status akun belum berubah. Coba lagi.') }
    finally { setBusyId('') }
  }

  async function reissue(userId: string) {
    setBusyId(userId)
    setError('')
    setNotice('')
    try {
      const result = await reissueActivation({ data: { userId } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      if (result.emailSent) setNotice('Email aktivasi baru dikirim. Tautan sebelumnya tidak berlaku.')
      else setError('Email aktivasi gagal dikirim. Periksa konfigurasi SMTP lalu kirim ulang.')
      await router.invalidate().catch(() => setError('Daftar belum diperbarui. Muat ulang halaman.'))
    } catch { setError('Tautan belum dibuat. Coba lagi.') }
    finally { setBusyId('') }
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Brand />
        <div className="sidebar-label">RUANG KERJA</div>
        <Link className="nav-link" to="/dashboard">Ringkasan</Link>
        <div className="nav-current">Akun admin</div>
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><span className="avatar">S</span><span><strong>Superadmin</strong><small>Pengelola platform</small></span></div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar"><span className="eyebrow">RUANG KERJA / AKUN ADMIN</span><Link to="/dashboard" className="text-link">Ringkasan</Link></header>
        <div className="dashboard-content admin-content">
          <div className="dashboard-heading"><p className="eyebrow">AKSES OPERASIONAL</p><h1>Kelola akun admin.</h1><p>Buat akun, kirim aktivasi melalui email, dan atur akses ketika peran seseorang berubah.</p></div>
          {error && <Alert color="red" role="alert" className="admin-feedback">{error}</Alert>}
          {notice && <Alert color="green" role="status" className="admin-feedback">{notice}</Alert>}
          <div className="admin-layout">
            <section className="admin-card admin-create">
              <p className="eyebrow">AKUN BARU</p><h2>Tambahkan admin</h2><p>Admin akan menerima email untuk menentukan kata sandinya sendiri.</p>
              <form onSubmit={submit} className="admin-form">
                <TextInput label="Nama lengkap" placeholder="Nama admin" value={name} onChange={(event) => setName(event.currentTarget.value)} required minLength={2} maxLength={100} disabled={pending} />
                <TextInput label="Alamat email" placeholder="admin@contoh.com" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required maxLength={254} disabled={pending} />
                <Button type="submit" loading={pending}>Buat akun admin</Button>
              </form>
            </section>
            <section className="admin-card admin-list">
              <div className="admin-section-head"><div><p className="eyebrow">DAFTAR AKUN</p><h2>Admin</h2></div><span className="admin-count">{admins.length} akun</span></div>
              {admins.length === 0 ? <div className="admin-empty">Belum ada admin. Tambahkan akun pertama melalui form di samping.</div> : (
                <div className="admin-rows">{admins.map((admin) => <article className="admin-row" key={admin.id}>
                  <div className="admin-identity"><span className="admin-initial">{admin.name.slice(0, 1).toUpperCase()}</span><div><strong>{admin.name}</strong><small>{admin.email}</small></div></div>
                  <div className="admin-row-actions"><span className={`admin-status ${adminStatus(admin) === 'Aktif' ? 'is-active' : ''}`}>{adminStatus(admin)}</span>
                    {admin.activatedAt ? <Button size="xs" variant="light" color={admin.isActive ? 'red' : 'green'} loading={busyId === admin.id} onClick={() => changeStatus(admin.id, !admin.isActive)}>{admin.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button> : <><Button size="xs" variant="light" loading={busyId === admin.id} onClick={() => reissue(admin.id)}>Kirim ulang email</Button>{admin.adminActivation && <Button size="xs" variant="subtle" color="red" loading={busyId === admin.id} onClick={() => changeStatus(admin.id, false)}>Batalkan akses</Button>}</>}
                  </div>
                </article>)}</div>
              )}
            </section>
          </div>
          <section className="admin-card admin-audit"><div className="admin-section-head"><div><p className="eyebrow">JEJAK PERUBAHAN</p><h2>Aktivitas terbaru</h2></div></div>{audits.length === 0 ? <p>Belum ada perubahan akun.</p> : <ol>{audits.map((audit) => <li key={audit.id}><span>{adminAuditActions[audit.action as keyof typeof adminAuditActions] ?? audit.action}</span><small>{audit.result === 'SUCCESS' ? 'Berhasil' : audit.result} · {audit.actorName} → {audit.targetName} · {new Date(audit.createdAt).toLocaleString('id-ID')}</small></li>)}</ol>}</section>
        </div>
      </main>
    </div>
  )
}
