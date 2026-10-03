import { useState, type FormEvent } from 'react'
import { Alert, Button, TextInput } from '@mantine/core'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { adminAuditActions } from '@/lib/admin-audit'
import { staffAccountStatus } from '@/lib/staff-access'
import { changeStaffStatus, createStaff, getStaffManagement, reissueStaff } from '@/lib/staff.functions'

export const Route = createFileRoute('/staff-accounts')({
  beforeLoad: async () => {
    const result = await getStaffManagement()
    if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
    if (result.status === 'forbidden') throw redirect({ to: '/unauthorized' })
    return result
  },
  component: StaffManagement,
})

function messageFor(code: string) {
  const messages: Record<string, string> = {
    FORBIDDEN: 'Sesi Anda tidak memiliki izin. Masuk kembali sebagai admin.',
    DUPLICATE: 'Alamat email sudah digunakan. Gunakan email lain.',
    NOT_FOUND: 'Akun staff tidak ditemukan. Muat ulang daftar.',
    INVALID_TOKEN: 'Tautan aktivasi tidak berlaku lagi.',
    NOT_ACTIVATED: 'Staff harus menyelesaikan aktivasi sebelum dapat diaktifkan.',
    ALREADY_ACTIVATED: 'Akun ini sudah pernah diaktivasi.',
  }
  return messages[code] ?? 'Tindakan gagal. Coba lagi.'
}

function StaffManagement() {
  const { staffMembers, audits } = Route.useRouteContext()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refresh() {
    await router.invalidate().catch(() => setError('Daftar belum diperbarui. Muat ulang halaman.'))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError('')
    setNotice('')
    setPending(true)
    try {
      const result = await createStaff({ data: { name, email } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      setName('')
      setEmail('')
      if (result.emailSent) setNotice('Staff dibuat. Email aktivasi telah dikirim.')
      else setError('Staff dibuat, tetapi email gagal dikirim. Gunakan Kirim ulang email pada daftar staff.')
      await refresh()
    } catch { setError('Akun belum dibuat. Periksa nama dan email, lalu coba lagi.') }
    finally { setPending(false) }
  }

  async function changeStatus(userId: string, active: boolean) {
    setBusyId(userId)
    setError('')
    setNotice('')
    try {
      const result = await changeStaffStatus({ data: { userId, active } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      setNotice(active ? 'Akun staff diaktifkan.' : 'Akun staff dinonaktifkan dan sesi lama dicabut.')
      await refresh()
    } catch { setError('Status akun belum berubah. Coba lagi.') }
    finally { setBusyId('') }
  }

  async function reissue(userId: string) {
    setBusyId(userId)
    setError('')
    setNotice('')
    try {
      const result = await reissueStaff({ data: { userId } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      if (result.emailSent) setNotice('Email aktivasi baru dikirim. Tautan sebelumnya tidak berlaku.')
      else setError('Email aktivasi gagal dikirim. Periksa konfigurasi SMTP lalu kirim ulang.')
      await refresh()
    } catch { setError('Email belum dapat dikirim. Coba lagi.') }
    finally { setBusyId('') }
  }

  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar"><Brand /><div className="sidebar-label">RUANG KERJA</div><Link className="nav-link" to="/admin">Ringkasan</Link><Link className="nav-link" to="/teachers">Akun teacher</Link><div className="nav-current">Akun staff</div><div className="sidebar-spacer" /><div className="sidebar-user"><span className="avatar">A</span><span><strong>Admin</strong><small>Pengelola operasional</small></span></div></aside>
    <main className="dashboard-main"><header className="dashboard-topbar"><span className="eyebrow">RUANG KERJA / AKUN STAFF</span><Link to="/admin" className="text-link">Ringkasan</Link></header>
      <div className="dashboard-content admin-content">
        <div className="dashboard-heading"><p className="eyebrow">TIM OPERASIONAL</p><h1>Kelola akun staff.</h1><p>Buat akun, kirim aktivasi melalui email, dan atur akses staff.</p></div>
        {error && <Alert color="red" role="alert" className="admin-feedback">{error}</Alert>}
        {notice && <Alert color="green" role="status" className="admin-feedback">{notice}</Alert>}
        <div className="admin-layout">
          <section className="admin-card admin-create"><p className="eyebrow">AKUN BARU</p><h2>Tambahkan staff</h2><p>Staff akan menerima email untuk menentukan kata sandinya sendiri.</p>
            <form onSubmit={submit} className="admin-form"><TextInput label="Nama lengkap" placeholder="Nama staff" value={name} onChange={(event) => setName(event.currentTarget.value)} required minLength={2} maxLength={100} disabled={pending} /><TextInput label="Alamat email" placeholder="staff@contoh.com" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required maxLength={254} disabled={pending} /><Button type="submit" loading={pending}>Buat akun staff</Button></form>
          </section>
          <section className="admin-card admin-list"><div className="admin-section-head"><div><p className="eyebrow">DAFTAR AKUN</p><h2>Staff</h2></div><span className="admin-count">{staffMembers.length} akun</span></div>
            {staffMembers.length === 0 ? <div className="admin-empty">Belum ada staff. Tambahkan akun pertama melalui form di samping.</div> : <div className="admin-rows">{staffMembers.map((staff) => <article className="admin-row" key={staff.id}>
              <div className="admin-identity"><span className="admin-initial">{staff.name.slice(0, 1).toUpperCase()}</span><div><strong>{staff.name}</strong><small>{staff.email}</small></div></div>
              <div className="admin-row-actions"><span className={`admin-status ${staffAccountStatus(staff) === 'Aktif' ? 'is-active' : ''}`}>{staffAccountStatus(staff)}</span>
                {staff.activatedAt ? <Button size="xs" variant="light" color={staff.isActive ? 'red' : 'green'} loading={busyId === staff.id} onClick={() => changeStatus(staff.id, !staff.isActive)}>{staff.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button> : <><Button size="xs" variant="light" loading={busyId === staff.id} onClick={() => reissue(staff.id)}>Kirim ulang email</Button>{staff.staffActivation && <Button size="xs" variant="subtle" color="red" loading={busyId === staff.id} onClick={() => changeStatus(staff.id, false)}>Batalkan akses</Button>}</>}
              </div>
            </article>)}</div>}
          </section>
        </div>
        <section className="admin-card admin-audit"><div className="admin-section-head"><div><p className="eyebrow">JEJAK PERUBAHAN</p><h2>Aktivitas staff</h2></div></div>{audits.length === 0 ? <p>Belum ada perubahan akun staff.</p> : <ol>{audits.map((audit) => <li key={audit.id}><span>{adminAuditActions[audit.action as keyof typeof adminAuditActions] ?? audit.action}</span><small>{audit.result === 'SUCCESS' ? 'Berhasil' : 'Gagal'} · {audit.actorName} → {audit.targetName} · {new Date(audit.createdAt).toLocaleString('id-ID')}</small></li>)}</ol>}</section>
      </div>
    </main>
  </div>
}
