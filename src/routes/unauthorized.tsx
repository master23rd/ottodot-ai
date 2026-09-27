import { createFileRoute, Link } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'

export const Route = createFileRoute('/unauthorized')({ component: Unauthorized })

function Unauthorized() {
  return <main className="state-page"><Brand /><div><p className="eyebrow">AKSES DIBATASI</p><h1>Ruang kerja ini belum tersedia untuk akun Anda.</h1><p>Hubungi pengelola OttoDot jika Anda membutuhkan akses.</p><Link to="/" className="primary-link">Kembali ke beranda</Link></div></main>
}
