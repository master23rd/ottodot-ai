import { createFileRoute, Link } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-header">
        <Brand />
        <Link className="text-link" to="/login">Masuk</Link>
      </header>
      <section className="landing-hero">
        <div>
          <p className="eyebrow">BELAJAR DENGAN RASA INGIN TAHU</p>
          <h1>Sains terasa dekat. Matematika jadi menyenangkan.</h1>
          <p>OttoDot menyiapkan ruang belajar daring untuk anak, guru, dan keluarga. Platform sedang disiapkan.</p>
          <Link className="primary-link" to="/login">Masuk ke OttoDot <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="orbit-card" aria-hidden="true"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="orbit-center">o<span>·</span></span></div>
      </section>
    </main>
  )
}
