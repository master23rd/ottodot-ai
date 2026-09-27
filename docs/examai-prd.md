# Product Requirements Document (PRD) — ExamAI

> Status: dokumen baseline produk yang telah diimplementasikan. Dokumen ini menjelaskan perilaku yang tersedia di kode saat ini; target metrik dan roadmap adalah arah produk, bukan klaim bahwa targetnya telah tercapai.

## 1. Executive Summary

### Problem Statement

Sekolah, lembaga kursus, dan penyelenggara pelatihan membutuhkan cara terpusat untuk membuat ujian, mengelola akun murid, menjalankan ujian berbatas waktu, dan mengolah hasil tanpa membocorkan kunci jawaban. Proses manual membuat distribusi akses, rekap nilai, bukti kelulusan, serta pelacakan aktivitas keamanan menjadi lambat dan sulit diaudit.

### Proposed Solution

ExamAI adalah SaaS ujian online multi-tenant untuk organisasi pendidikan. Platform mencakup onboarding dan subscription, authoring ujian pilihan ganda (manual atau dibantu AI), provisioning murid dengan aktivasi email, pengerjaan dan penilaian server-side, hasil live, ekspor Excel, email hasil, sertifikat PDF privat, verifikasi sertifikat publik, serta audit keamanan.

### Success Criteria

- Sedikitnya 60% organisasi baru mempublikasikan ujian pertama dalam tujuh hari setelah registrasi.
- Sedikitnya 70% ujian yang dipublikasikan memiliki minimal satu attempt dalam 14 hari.
- Sedikitnya 80% tenant aktif bulanan membuka hasil live atau mengekspor hasil setidaknya sekali per bulan.
- Median waktu dari subscription aktif hingga ujian pertama dipublikasikan kurang dari 30 menit.
- Tidak ada respons jalur murid yang mengekspos `isCorrect`, kunci jawaban, pembahasan, atau metadata penilaian internal.

## 2. User Experience & Functionality

### User Personas

- **Owner / Admin organisasi**: mendaftarkan organisasi, memilih paket, mengelola subscription, memantau workspace, dan mengelola roster murid.
- **Guru**: membuat kategori dan ujian, menyusun atau menghasilkan soal, mempublikasikan ujian, mengelola murid, melihat hasil, dan mengunduh ekspor.
- **Murid**: mengaktifkan akun sendiri, mengerjakan ujian yang tersedia, melihat hasil sesuai kebijakan ujian, menerima email, dan mengunduh sertifikat bila lulus.
- **Pihak ketiga**: memverifikasi keaslian sertifikat melalui nomor sertifikat tanpa perlu akun.

### User Stories and Acceptance Criteria

#### Onboarding, autentikasi, dan billing

As an owner, I want to register an organization, select a plan, and complete payment so that my organization can use the teacher workspace.

- Landing page, register, sign-in, dan tenant workspace tersedia.
- Registrasi membuat organisasi dengan slug dan keanggotaan pengguna yang terisolasi per tenant.
- Paket bulanan tersedia: Starter (10 ujian/200 murid, Rp149.000), Growth (30/1.000, Rp299.000), dan Pro (100/5.000, Rp599.000).
- Checkout menggunakan Midtrans; webhook pembayaran memperbarui status subscription.
- Akses workspace guru dibatasi untuk role `owner`, `admin`, atau `guru` dengan subscription aktif.
- Halaman billing menampilkan status subscription dan pemakaian kuota.

#### Authoring dan publikasi ujian

As a teacher, I want to create a categorized multiple-choice exam and publish it when valid so that students can take it online.

- Guru dapat membuat, mengubah, dan menghapus kategori ujian dalam tenantnya.
- Ujian draft menyimpan judul, kategori, deskripsi, durasi, jadwal buka/tutup, kebijakan visibilitas hasil, dan passing score 0–100 (default 70).
- Guru dapat menambah, mengubah, menyusun ulang, dan menghapus soal pilihan ganda beserta opsi, jawaban benar, dan pembahasan.
- Ujian dapat disimpan sebagai draft; ujian published tidak dapat diedit sebagai draft kembali.
- Publish mensyaratkan minimal satu soal valid, kuota ujian aktif, dan konfigurasi hasil tertunda memiliki `closesAt`.
- Saat dipublikasikan, passing score terkunci; tindakan publish dicatat pada audit exam dan security audit.

#### Pembuatan soal dengan AI

As a teacher, I want to generate draft questions from a topic so that I can prepare an exam faster.

- Guru memilih topik, tingkat kesulitan, jumlah soal, dan bahasa untuk generasi OpenAI.
- Output divalidasi terhadap schema soal, dicatat per tenant/user/exam di AI usage log, lalu diterapkan hanya ke ujian draft.
- Guru tetap meninjau dan dapat mengedit atau menghapus hasil AI sebelum publish.
- Generasi atau penerapan AI untuk ujian published ditolak.

#### Roster dan aktivasi akun murid

As a teacher, I want to provision students and let them set their own password so that student access is secure and manageable.

- Guru/admin dapat menambah murid satu per satu atau mengimpor CSV; data invalid dan duplikat dilaporkan per baris.
- Provisioning membuat profil murid tenant-scoped, akun tanpa password sementara, activation record, dan pekerjaan email secara atomik.
- Email aktivasi menyediakan tautan sekali pakai yang berlaku 24 jam untuk membuat password; token mentah tidak disimpan.
- Aktivasi memverifikasi email, mengonsumsi token, dan mengarahkan murid ke sign-in; aktivasi tidak melakukan sign-in otomatis.
- Roster menampilkan status aktivasi/delivery. Admin atau guru berwenang dapat mengirim ulang aktivasi; tautan lama langsung dinonaktifkan.

#### Pengerjaan dan hasil ujian murid

As a student, I want to complete an available exam in its time window so that my answers are graded correctly.

- Murid hanya dapat melihat ujian published dalam organisasi dan jendela aksesnya.
- Murid dapat memulai satu attempt per ujian, menyimpan pilihan jawaban, dan menyerahkan attempt sebelum batas waktu.
- Server menetapkan waktu kedaluwarsa, melakukan autosubmit ketika habis, dan menghitung skor serta jumlah jawaban benar di server.
- Hasil dapat dikonfigurasi sebagai langsung atau setelah ujian ditutup. Hasil tertunda tidak terlihat sebelum `closesAt`.
- Hasil murid menampilkan skor dan status lulus berdasarkan passing score hanya ketika kebijakan visibilitas mengizinkan; jawaban benar dan pembahasan tidak dibuka ke murid.
- Start, submit, dan timeout attempt dicatat pada security audit.

#### Hasil live dan ekspor

As a teacher, I want live monitoring and an Excel export so that I can evaluate a class efficiently.

- Dashboard menampilkan jumlah anggota, murid, kategori, ujian, ujian published, rata-rata skor, aktivitas lima minggu, ujian terbaru, perhatian operasional, dan ringkasan penggunaan AI.
- Hasil live per ujian published memuat peserta, progress, submitted/timed-out, completion rate, rata-rata skor, rata-rata jawaban benar, dan daftar attempt terbaru.
- Ekspor `.xlsx` memuat nama dan email murid, nama ujian, skor, jumlah benar/salah, waktu submit, dan durasi pengerjaan; data attempt yang masih berjalan dibiarkan kosong.
- Ekspor tersedia hanya di tenant yang benar dan dicatat sebagai event keamanan.

#### Notifikasi, sertifikat, dan verifikasi

As a student, I want trusted notifications and proof of passing so that I can confirm my result and share a credential safely.

- Setelah attempt difinalisasi, sistem mengantrikan konfirmasi submit; hasil dikirim segera jika hasil langsung atau setelah `closesAt` jika hasil tertunda.
- Email hasil berisi judul ujian, waktu submit dalam WIB, skor, jumlah benar, total soal, dan status lulus; email tidak memuat jawaban atau pembahasan.
- Murid yang lulus dan hasilnya sudah boleh dibuka menerima sertifikat PDF privat dengan nomor unik, data penerbit, nama murid, judul ujian, dan tanggal lulus.
- PDF disimpan di Supabase Storage; unduhan mensyaratkan autentikasi dan kepemilikan attempt.
- Halaman verifikasi publik menerima nomor sertifikat dan hanya mengungkap validitas, nama murid, judul ujian, organisasi penerbit, serta tanggal lulus.
- Penerbitan sertifikat dan notifikasi idempoten: satu sertifikat per attempt serta satu outbox per jenis notifikasi.

### Non-Goals

- Essay/manual grading dan tipe soal selain multiple choice.
- Aplikasi mobile native.
- Proctoring webcam, deteksi perpindahan tab, atau fullscreen enforcement.
- Revokasi, masa berlaku, reissue, atau template sertifikat kustom.
- Pengiriman ulang email hasil secara manual dan dashboard remediation email khusus.
- Domain pengirim email atau template email kustom per organisasi.
- Pembahasan, opsi terpilih, atau kunci jawaban dalam email maupun verifikasi publik.

## 3. AI System Requirements

### Tool Requirements

- OpenAI API menghasilkan draft soal pilihan ganda untuk ujian draft.
- Validasi schema memastikan prompt, opsi, urutan, dan jawaban benar dapat disimpan secara aman.
- `AIUsageLog` menyimpan provider, model, topik, tingkat kesulitan, bahasa, jumlah yang diminta/dihasilkan, status, dan error untuk tenant, guru, serta ujian terkait.

### Evaluation Strategy

- Pantau acceptance rate dan edit rate soal hasil AI sebelum ujian dipublish.
- Pantau jumlah generasi sukses/gagal, latency, dan biaya per request dari log penggunaan.
- Lakukan sampel review berkala untuk relevansi topik, kesesuaian tingkat kesulitan, kualitas distraktor, dan validitas jawaban.

## 4. Technical Specifications

### Architecture Overview

ExamAI menggunakan TanStack Start dan React untuk aplikasi full-stack, Prisma dengan PostgreSQL untuk data, Better Auth untuk sesi/kredensial, Mantine dan Tailwind untuk UI, serta arsitektur feature-first di `src/features`. Batas data utama adalah organisasi/tenant; route dan service memverifikasi tenant, role, serta kepemilikan resource.

Alur utama: organisasi terdaftar → paket dipilih dan dibayar via Midtrans → guru membuat draft dan mempublikasikan ujian → murid diprovision dan mengaktifkan akun melalui email → murid mengerjakan attempt → server finalisasi/grading → hasil, notifikasi, dan sertifikat diproses → guru melihat hasil/export atau pihak ketiga memverifikasi sertifikat.

### Integration Points

- **Payment**: Midtrans checkout dan webhook terverifikasi.
- **AI**: OpenAI untuk draft soal.
- **Email**: Mailtrap adapter dengan outbox notifikasi durable dan pengiriman segera setelah commit bila memungkinkan.
- **Scheduler**: `node-cron`; pemeriksaan sertifikat berjalan setiap menit dan recovery/outbox notifikasi setiap jam.
- **Storage**: Supabase Storage bucket privat `certificates`.
- **Dokumen**: `@react-pdf/renderer` untuk PDF sertifikat dan ExcelJS untuk ekspor hasil.

### Key Data Model

- Identity/tenant: `User`, `Session`, `Organization`, `Member`, `Invitation`.
- Billing: `OrganizationSubscription` dengan plan, kuota, status, serta metadata Midtrans.
- Assessment: `ExamCategory`, `Exam`, `ExamQuestion`, `ExamQuestionOption`, `ExamAttempt`, dan `ExamAttemptResponse`.
- Operations: `AIUsageLog`, `ExamAuditLog`, `SecurityAuditEvent`, dan `RateLimitBucket`.
- Student lifecycle: `StudentProfile`, `StudentActivation`, `NotificationOutbox`, dan `Certificate`.

### Security & Privacy

- Kunci jawaban (`isCorrect`) hanya dipakai pada jalur server/guru; DTO murid tidak menyertakannya dan grading tidak dilakukan di client.
- Semua operasi teacher/admin dan resource tenant memvalidasi sesi, role, tenant ID, serta resource ownership; murid hanya mengakses profile dan attempt sendiri.
- Payload JSON divalidasi dengan Zod. Request state-changing menerapkan same-origin check, dan endpoint sensitif memakai fixed-window rate limit berbasis database.
- Security audit mencatat publish ujian, start/submit/timeout attempt, export hasil, dan lifecycle aktivasi tanpa token mentah atau password.
- Password dikelola oleh Better Auth; activation token disimpan dalam bentuk hash dan berlaku sekali pakai.
- Outbox menyimpan status, percobaan, jadwal retry, waktu delivered, serta error. Pengiriman gagal mencoba kembali dengan jeda 5, 30, dan 120 menit, lalu gagal terminal tanpa membatalkan provisioning atau finalisasi ujian.
- Sertifikat dan unduhan PDF tidak bersifat publik; endpoint verifikasi publik sengaja mengekspos data minimum tanpa email, skor, attempt, atau URL storage.

## 5. Risks & Roadmap

### Current Release

Fitur pada bagian 2 dan 4 merupakan baseline yang telah tersedia: subscription Midtrans, authoring manual/AI, roster dan aktivasi, attempt dan grading, live results/Excel, email outbox, sertifikat/verifikasi, dan security audit.

### Next Iterations

- Analitik kelas dan penggunaan AI yang lebih mendalam.
- Assignment murid yang lebih granular dan manajemen roster massal yang lebih luas.
- Observability operasional untuk payment, delivery email, grading, serta AI.
- Kontrol hasil tambahan, tipe soal baru, anti-cheat, dan laporan/remedial berbantuan AI.

### Technical Risks and Mitigations

- **Provider eksternal gagal atau lambat**: OpenAI, Midtrans, Mailtrap, dan Supabase dapat gagal; gunakan validasi, webhook verification, outbox/retry, serta proses scheduler sebagai recovery path.
- **Scheduler in-process tidak berjalan**: pekerjaan deferred/retry dapat tertunda bila aplikasi mati; state outbox yang durable memungkinkan migrasi ke worker/scheduler eksternal di masa depan.
- **Kebocoran lintas tenant atau answer key**: mitigasi dengan guard tenant/role/ownership, DTO terpisah, dan test authorization/regression.
- **Beban hasil live dan export**: agregasi attempt dan file Excel dapat membebani database untuk kelas besar; pantau query dan tambah pagination/optimasi saat volume tumbuh.
- **Keterlambatan sertifikat/notifikasi**: sertifikat dan email tidak boleh mengubah hasil attempt yang telah final; gunakan idempotensi, retry terbatas, dan akses aplikasi sebagai sumber kebenaran utama.
