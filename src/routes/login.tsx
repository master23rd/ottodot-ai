import { useState, type FormEvent } from 'react'
import { Alert, Button, PasswordInput, TextInput } from '@mantine/core'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Brand } from '@/components/Brand'
import { getMyWorkspace } from '@/lib/admin.functions'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()
  const router = useRouter()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError('')
    setPending(true)
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.code === 'ACCOUNT_INACTIVE' ? 'Akun nonaktif. Hubungi pengelola untuk memulihkan akses.' : 'Email atau kata sandi tidak cocok.')
        return
      }
      await router.invalidate()
      const workspace = await getMyWorkspace()
      if (workspace.status !== 'ok') {
        await authClient.signOut()
        setError('Akun tidak aktif atau belum memiliki akses.')
        return
      }
      await navigate({ to: workspace.user.role === 'SUPERADMIN' ? '/dashboard' : workspace.user.role === 'TEACHER' ? '/teacher' : workspace.user.role === 'STAFF' ? '/staff' : '/admin' })
    } catch {
      setError('Tidak dapat masuk sekarang. Coba lagi beberapa saat.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <aside className="auth-story">
          <Brand />
          <div className="auth-story-copy">
            <p className="eyebrow">RUANG BELAJAR OTTO·DOT</p>
            <h1>Rasa ingin tahu dimulai dari satu titik.</h1>
            <p>Kelola kelas, peserta, dan perjalanan belajar anak dari satu tempat yang rapi.</p>
            <div className="story-dots" aria-hidden="true"><i/><i/><i/><i/></div>
          </div>
          <p className="story-foot">Sains & matematika untuk penjelajah kecil.</p>
        </aside>
        <div className="auth-form-side">
          <div className="mobile-brand"><Brand /><Link to="/" className="text-link">Beranda</Link></div>
          <div className="auth-form-inner">
            <p className="eyebrow">SELAMAT DATANG KEMBALI</p>
            <h2>Masuk ke OttoDot</h2>
            <p className="muted">Gunakan akun Anda untuk melanjutkan.</p>
            <form onSubmit={submit} className="login-form">
              <TextInput label="Alamat email" placeholder="nama@contoh.com" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required disabled={pending} />
              <PasswordInput label="Kata sandi" placeholder="Masukkan kata sandi" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} required disabled={pending} />
              {error && <Alert color="red" role="alert">{error}</Alert>}
              <Button type="submit" fullWidth size="md" loading={pending}>Masuk ke ruang kerja</Button>
            </form>
            <p className="auth-help">Akun baru untuk admin, teacher, dan staff dibuat oleh pengelola OttoDot.</p>
          </div>
          <p className="auth-footer">© {new Date().getFullYear()} OttoDot</p>
        </div>
      </section>
    </main>
  )
}
