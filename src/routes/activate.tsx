import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, PasswordInput } from '@mantine/core'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import { completeAdminActivation } from '@/lib/admin.functions'

export const Route = createFileRoute('/activate')({ component: ActivateAdmin })

function ActivateAdmin() {
  const [token, setToken] = useState('')
  const [linkChecked, setLinkChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function readToken() {
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      setToken(fragment.get('token') ?? '')
      setLinkChecked(true)
    }
    readToken()
    window.addEventListener('hashchange', readToken)
    return () => window.removeEventListener('hashchange', readToken)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirm) { setError('Kata sandi dan konfirmasi belum sama.'); return }
    setError('')
    setPending(true)
    try {
      const result = await completeAdminActivation({ data: { token, password } })
      if (!result.ok) {
        setError(result.code === 'INVALID_TOKEN' ? 'Tautan tidak berlaku atau sudah kedaluwarsa. Minta tautan baru kepada superadmin.' : 'Aktivasi gagal. Coba lagi.')
        return
      }
      setComplete(true)
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      setToken('')
      setPassword('')
      setConfirm('')
    } catch { setError('Aktivasi gagal. Periksa kata sandi dan coba lagi.') }
    finally { setPending(false) }
  }

  return <main className="auth-wrap"><section className="auth-card">
    <aside className="auth-story"><Brand /><div className="auth-story-copy"><p className="eyebrow">AKUN ADMIN OTTO·DOT</p><h1>Siapkan ruang kerja Anda.</h1><p>Tetapkan kata sandi untuk mulai mengelola operasional OttoDot.</p><div className="story-dots" aria-hidden="true"><i/><i/><i/><i/></div></div><p className="story-foot">Sains & matematika untuk penjelajah kecil.</p></aside>
    <div className="auth-form-side"><div className="mobile-brand"><Brand /></div><div className="auth-form-inner">
      <p className="eyebrow">AKTIVASI ADMIN</p><h2>{complete ? 'Akun siap digunakan' : 'Buat kata sandi'}</h2>
      {complete ? <><p className="muted">Akun admin Anda sudah aktif. Masuk untuk membuka ruang kerja.</p><Link className="primary-link" to="/login">Masuk sekarang</Link></> : <><p className="muted">Gunakan minimal 16 karakter. Tautan ini berlaku sekali.</p>
        {linkChecked && !token && <Alert color="orange" role="alert">Tautan aktivasi tidak ditemukan. Minta tautan baru kepada superadmin.</Alert>}
        <form onSubmit={submit} className="login-form">
          <PasswordInput label="Kata sandi baru" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} required minLength={16} maxLength={128} disabled={pending || !token} />
          <PasswordInput label="Ulangi kata sandi" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.currentTarget.value)} required minLength={16} disabled={pending || !token} />
          {error && <Alert color="red" role="alert">{error}</Alert>}
          <Button type="submit" fullWidth loading={pending} disabled={!token}>Aktifkan akun</Button>
        </form></>}
    </div><p className="auth-footer">OttoDot</p></div>
  </section></main>
}
