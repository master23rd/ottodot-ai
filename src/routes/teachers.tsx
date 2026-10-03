import { useState, type FormEvent } from 'react'
import { Alert, Button, TextInput } from '@mantine/core'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { adminAuditActions } from '@/lib/admin-audit'
import { teacherAccountStatus } from '@/lib/teacher-access'
import { changeTeacherStatus, createTeacher, getTeacherManagement, reissueTeacher } from '@/lib/teacher.functions'

export const Route = createFileRoute('/teachers')({
  beforeLoad: async () => {
    const result = await getTeacherManagement()
    if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
    if (result.status === 'forbidden') throw redirect({ to: '/unauthorized' })
    return result
  },
  component: TeacherManagement,
})

function messageFor(code: string) {
  const messages: Record<string, string> = {
    FORBIDDEN: 'Sesi Anda tidak memiliki izin. Masuk kembali sebagai admin.',
    DUPLICATE: 'Alamat email sudah digunakan. Gunakan email lain.',
    NOT_FOUND: 'Akun teacher tidak ditemukan. Muat ulang daftar.',
    INVALID_TOKEN: 'Tautan aktivasi tidak berlaku lagi.',
    NOT_ACTIVATED: 'Teacher harus menyelesaikan aktivasi sebelum dapat diaktifkan.',
    ALREADY_ACTIVATED: 'Akun ini sudah pernah diaktivasi.',
  }
  return messages[code] ?? 'Tindakan gagal. Coba lagi.'
}

function TeacherManagement() {
  const { teachers, audits } = Route.useRouteContext()
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
      const result = await createTeacher({ data: { name, email } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      setName('')
      setEmail('')
      if (result.emailSent) setNotice('Teacher dibuat. Email aktivasi telah dikirim.')
      else setError('Teacher dibuat, tetapi email gagal dikirim. Gunakan Kirim ulang email pada daftar teacher.')
      await refresh()
    } catch { setError('Akun belum dibuat. Periksa nama dan email, lalu coba lagi.') }
    finally { setPending(false) }
  }

  async function changeStatus(userId: string, active: boolean) {
    setBusyId(userId)
    setError('')
    setNotice('')
    try {
      const result = await changeTeacherStatus({ data: { userId, active } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      setNotice(active ? 'Akun teacher diaktifkan.' : 'Akun teacher dinonaktifkan dan sesi lama dicabut.')
      await refresh()
    } catch { setError('Status akun belum berubah. Coba lagi.') }
    finally { setBusyId('') }
  }

  async function reissue(userId: string) {
    setBusyId(userId)
    setError('')
    setNotice('')
    try {
      const result = await reissueTeacher({ data: { userId } })
      if (!result.ok) { setError(messageFor(result.code)); return }
      if (result.emailSent) setNotice('Email aktivasi baru dikirim. Tautan sebelumnya tidak berlaku.')
      else setError('Email aktivasi gagal dikirim. Periksa konfigurasi SMTP lalu kirim ulang.')
      await refresh()
    } catch { setError('Email belum dapat dikirim. Coba lagi.') }
    finally { setBusyId('') }
  }

  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar"><Brand /><div className="sidebar-label">RUANG KERJA</div><Link className="nav-link" to="/admin">Ringkasan</Link><div className="nav-current">Akun teacher</div><Link className="nav-link" to="/staff-accounts">Akun staff</Link><div className="sidebar-spacer" /><div className="sidebar-user"><span className="avatar">A</span><span><strong>Admin</strong><small>Pengelola pengajar</small></span></div></aside>
    <main className="dashboard-main"><header className="dashboard-topbar"><span className="eyebrow">RUANG KERJA / AKUN TEACHER</span><Link to="/admin" className="text-link">Ringkasan</Link></header>
      <div className="dashboard-content admin-content">
        <div className="dashboard-heading"><p className="eyebrow">TIM PENGAJAR</p><h1>Kelola akun teacher.</h1><p>Buat akun, kirim aktivasi melalui email, dan atur akses pengajar.</p></div>
        {error && <Alert color="red" role="alert" className="admin-feedback">{error}</Alert>}
        {notice && <Alert color="green" role="status" className="admin-feedback">{notice}</Alert>}
        <div className="admin-layout">
          <section className="admin-card admin-create"><p className="eyebrow">AKUN BARU</p><h2>Tambahkan teacher</h2><p>Teacher akan menerima email untuk menentukan kata sandinya sendiri.</p>
            <form onSubmit={submit} className="admin-form"><TextInput label="Nama lengkap" placeholder="Nama teacher" value={name} onChange={(event) => setName(event.currentTarget.value)} required minLength={2} maxLength={100} disabled={pending} /><TextInput label="Alamat email" placeholder="teacher@contoh.com" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required maxLength={254} disabled={pending} /><Button type="submit" loading={pending}>Buat akun teacher</Button></form>
          </section>
          <section className="admin-card admin-list"><div className="admin-section-head"><div><p className="eyebrow">DAFTAR AKUN</p><h2>Teacher</h2></div><span className="admin-count">{teachers.length} akun</span></div>
            {teachers.length === 0 ? <div className="admin-empty">Belum ada teacher. Tambahkan akun pertama melalui form di samping.</div> : <div className="admin-rows">{teachers.map((teacher) => <article className="admin-row" key={teacher.id}>
              <div className="admin-identity"><span className="admin-initial">{teacher.name.slice(0, 1).toUpperCase()}</span><div><strong>{teacher.name}</strong><small>{teacher.email}</small></div></div>
              <div className="admin-row-actions"><span className={`admin-status ${teacherAccountStatus(teacher) === 'Aktif' ? 'is-active' : ''}`}>{teacherAccountStatus(teacher)}</span>
                {teacher.activatedAt ? <Button size="xs" variant="light" color={teacher.isActive ? 'red' : 'green'} loading={busyId === teacher.id} onClick={() => changeStatus(teacher.id, !teacher.isActive)}>{teacher.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button> : <><Button size="xs" variant="light" loading={busyId === teacher.id} onClick={() => reissue(teacher.id)}>Kirim ulang email</Button>{teacher.teacherActivation && <Button size="xs" variant="subtle" color="red" loading={busyId === teacher.id} onClick={() => changeStatus(teacher.id, false)}>Batalkan akses</Button>}</>}
              </div>
            </article>)}</div>}
          </section>
        </div>
        <section className="admin-card admin-audit"><div className="admin-section-head"><div><p className="eyebrow">JEJAK PERUBAHAN</p><h2>Aktivitas teacher</h2></div></div>{audits.length === 0 ? <p>Belum ada perubahan akun teacher.</p> : <ol>{audits.map((audit) => <li key={audit.id}><span>{adminAuditActions[audit.action as keyof typeof adminAuditActions] ?? audit.action}</span><small>{audit.result === 'SUCCESS' ? 'Berhasil' : 'Gagal'} · {audit.actorName} → {audit.targetName} · {new Date(audit.createdAt).toLocaleString('id-ID')}</small></li>)}</ol>}</section>
      </div>
    </main>
  </div>
}
