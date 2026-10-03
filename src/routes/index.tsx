import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Brand } from '@/components/Brand'
import '../landing.css'

export const Route = createFileRoute('/')({ component: Home })

type PreviewTab = 'kelas' | 'jadwal' | 'perkembangan'

const tabs: { id: PreviewTab; label: string }[] = [
  { id: 'kelas', label: 'Kelas anak' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'perkembangan', label: 'Perkembangan' },
]

function Home() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('kelas')

  return <main className="home-page"><div className="home-frame">
    <header className="home-header">
      <Brand />
      <nav className="home-nav" aria-label="Navigasi utama"><a href="#cara-belajar">Cara belajar</a><a href="#untuk-keluarga">Untuk keluarga</a><a href="#pratinjau">Pratinjau</a></nav>
      <div className="home-header-actions"><Link to="/login" className="home-signin">Masuk</Link><a href="#cara-belajar" className="home-button home-button-small">Jelajahi kelas <span aria-hidden="true">→</span></a></div>
    </header>

    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <span className="home-pill"><i /> SAINS & MATEMATIKA UNTUK ANAK</span>
        <h1 id="home-title">Rasa ingin tahu punya <em>tempat bertumbuh.</em></h1>
        <p>Kelas daring OttoDot mengajak anak bertanya, mencoba, dan menemukan jawabannya sendiri. Orang tua bisa mengikuti perjalanan belajarnya dari satu tempat.</p>
        <div className="home-hero-actions"><a href="#cara-belajar" className="home-button">Lihat cara belajar <span aria-hidden="true">→</span></a><a href="#pratinjau" className="home-button-outline">Lihat ruang belajar <span aria-hidden="true">→</span></a></div>
        <div className="home-hero-notes"><span>✓ &nbsp; Pilihan kelas trial</span><span>✓ &nbsp; Akun anak terpisah</span></div>
      </div>
      <div className="home-hero-visual" aria-label="Ilustrasi ruang belajar OttoDot">
        <div className="home-mini-workspace">
          <div className="home-mini-top"><span className="home-mini-logo">✦</span><span><strong>Ruang belajar OttoDot</strong><small>Contoh tampilan untuk keluarga</small></span><span className="home-mini-live">Belajar aktif</span></div>
          <div className="home-mini-grid">
            <div className="home-mini-week"><span className="home-overline">MINGGU INI</span><div className="home-mini-highlight"><small>Eksperimen seru</small><strong>Mengapa pelangi punya warna?</strong><small>Sains · Kelas anak</small></div><div className="home-mini-line"><span>Kelas berikutnya</span><strong>Sabtu</strong></div><div className="home-mini-line"><span>Topik baru</span><strong>2</strong></div></div>
            <div className="home-mini-lesson"><div className="home-mini-lesson-head"><span className="home-overline">SIAP DIJELAJAHI</span><span>✦</span></div><h2>Petualangan angka dan pola</h2><p>Amati pola di sekitarmu, lalu coba temukan kelanjutannya.</p><div className="home-pattern" aria-hidden="true"><span>●</span><span>▲</span><span>●</span><span>▲</span><span>?</span></div><div className="home-mini-lesson-foot"><span>A</span> Belajar dengan rasa ingin tahu</div></div>
          </div>
        </div>
        <div className="home-floating-note"><span>✓</span><div><strong>Trial untuk mencoba</strong><small>Temukan kelas yang cocok</small></div></div>
      </div>
    </section>

    <div className="home-ribbon"><span>SEBUAH RUANG UNTUK</span><div>bertanya <i /> bereksperimen <i /> berlatih <i /> bertumbuh</div></div>

    <section className="home-features" id="cara-belajar" aria-labelledby="features-title">
      <div className="home-section-intro"><span className="home-kicker">PERJALANAN BELAJAR</span><h2 id="features-title">Dari pertanyaan kecil, lahir penemuan besar.</h2><p>Mulai dari kelas yang sesuai, lanjutkan eksplorasi bersama pengajar, dan beri anak ruang untuk mencoba dengan caranya sendiri.</p></div>
      <div className="home-feature-grid">
        <article className="home-feature-card home-feature-wide"><span className="home-feature-icon">✦</span><span className="home-overline">01 / PILIH KELAS</span><h3>Temukan awal yang pas.</h3><p>Jelajahi kelas sains dan matematika. Kelas trial memberi keluarga kesempatan mengenal cara belajar OttoDot.</p><div className="home-feature-mini"><span>Eksplorasi sains</span><i /><i /><i /><strong>Trial</strong></div></article>
        <article className="home-feature-card"><span className="home-feature-icon">△</span><span className="home-overline">02 / BELAJAR</span><h3>Anak ikut mencoba, bukan hanya mendengar.</h3><p>Topik disampaikan lewat pertanyaan, aktivitas, dan latihan yang mengundang anak berpikir.</p><div className="home-feature-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div></article>
        <article className="home-feature-card"><span className="home-feature-icon">↗</span><span className="home-overline">03 / IKUTI</span><h3>Orang tua tetap dekat dengan prosesnya.</h3><p>Satu tempat untuk melihat pilihan kelas, jadwal, dan perjalanan belajar anak.</p><div className="home-feature-progress"><span>Perjalanan belajar</span><strong>Terus bertumbuh</strong><div><i /></div></div></article>
      </div>
    </section>

    <section className="home-preview" id="pratinjau" aria-labelledby="preview-title">
      <div className="home-preview-heading"><div><span className="home-kicker">PRATINJAU PRODUK</span><h2 id="preview-title">Satu rumah untuk perjalanan anak.</h2></div><p>Contoh tampilan ruang keluarga. Pilih bagian di samping untuk melihat bagaimana informasi belajar disusun.</p></div>
      <div className="home-preview-window"><aside className="home-preview-sidebar"><div className="home-preview-brand"><span>✦</span><strong>ottodot</strong></div><span className="home-overline">RUANG KELUARGA</span><div className="home-preview-tabs" role="tablist" aria-label="Pratinjau ruang keluarga">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} className={activeTab === tab.id ? 'is-selected' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div><div className="home-preview-profile"><span>A</span><div><strong>Keluarga A</strong><small>Contoh akun member</small></div></div></aside>
        <div className="home-preview-content" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
          {activeTab === 'kelas' && <><div className="home-preview-title"><div><small>Selamat datang di OttoDot</small><h3>Kelas untuk penjelajah kecil.</h3></div><span className="home-preview-badge">Contoh tampilan</span></div><div className="home-preview-stats"><div><small>Profil anak</small><strong>1</strong><span>Siap memilih kelas</span></div><div><small>Jenis kelas</small><strong>2</strong><span>Trial dan berbayar</span></div><div><small>Bidang belajar</small><strong>2</strong><span>Sains dan matematika</span></div></div><div className="home-preview-panels"><div className="home-preview-class"><span className="home-overline">KELAS YANG BISA DIJELAJAHI</span><h4>Eksplorasi sains</h4><p>Mulai dengan pertanyaan sederhana tentang dunia di sekitar kita.</p><span className="home-tag">Kelas trial</span></div><div className="home-preview-tip"><span>✦</span><h4>Belajar dimulai dari rasa penasaran.</h4><p>Beri anak ruang untuk mengamati, menebak, lalu mencoba.</p></div></div></>}
          {activeTab === 'jadwal' && <><div className="home-preview-title"><div><small>Rencanakan waktu belajar</small><h3>Jadwal yang mudah diikuti.</h3></div><span className="home-preview-badge">Contoh tampilan</span></div><div className="home-preview-list"><div><span className="home-date">SAB<br /><strong>10</strong></span><div><strong>Eksplorasi sains</strong><small>Mengamati warna dan cahaya</small></div><span className="home-tag">Trial</span></div><div><span className="home-date">RAB<br /><strong>14</strong></span><div><strong>Petualangan angka</strong><small>Menemukan pola di sekitar kita</small></div><span className="home-tag home-tag-muted">Kelas</span></div></div></>}
          {activeTab === 'perkembangan' && <><div className="home-preview-title"><div><small>Ikuti proses anak</small><h3>Setiap langkah berarti.</h3></div><span className="home-preview-badge">Contoh tampilan</span></div><div className="home-preview-progress"><span>TOPIK YANG DIJELAJAHI</span><h4>Melihat pola, mengajukan pertanyaan, dan mencoba jawaban.</h4><div><i /></div><p>Perjalanan belajar akan tampil di sini setelah anak mengikuti kelas.</p></div></>}
        </div>
      </div>
    </section>

    <section className="home-family" id="untuk-keluarga" aria-labelledby="family-title"><div><span className="home-kicker">UNTUK KELUARGA</span><h2 id="family-title">Orang tua memilih.<br />Anak menjelajah.</h2><p>Orang tua mengelola profil anak dan pendaftaran kelas. Anak mendapat ruang belajarnya sendiri untuk mengakses kelas yang diikuti.</p></div><div className="home-family-steps"><div><span>01</span>Buat profil anak</div><div><span>02</span>Pilih trial atau kelas</div><div><span>03</span>Mulai belajar bersama</div></div></section>

    <section className="home-cta" aria-labelledby="cta-title"><div><span className="home-kicker">MULAI DARI RASA INGIN TAHU</span><h2 id="cta-title">Siap melihat dunia dari sudut pandang baru?</h2><p>Kenali cara belajar OttoDot dan temukan kelas yang membuat anak ingin terus bertanya.</p></div><div className="home-cta-actions"><a href="#cara-belajar" className="home-button-light">Jelajahi cara belajar →</a><Link to="/login" className="home-button-ghost">Masuk ke akun</Link></div></section>

    <footer className="home-footer"><div className="home-footer-main"><div><Brand /><p>Ruang belajar sains dan matematika untuk anak yang gemar bertanya.</p></div><div><strong>JELAJAHI</strong><a href="#cara-belajar">Cara belajar</a><a href="#pratinjau">Pratinjau</a><a href="#untuk-keluarga">Untuk keluarga</a></div><div><strong>AKUN</strong><Link to="/login">Masuk</Link></div></div><div className="home-footer-bottom"><span>© {new Date().getFullYear()} OttoDot</span><span>Belajar dimulai dari pertanyaan.</span></div></footer>
  </div></main>
}
