# Product Requirements Document (PRD) — OttoDot Learning Platform

> Status: rancangan target. Salinan repository lokal saat penyusunan dokumen berisi PRD dan template HTML, belum berisi implementasi OttoDot. Detail arsitektur ExamAI di bawah adalah konteks teknis yang diberikan, bukan klaim bahwa kode ExamAI tersedia di checkout ini.

## 1. Executive Summary

### Problem Statement

OttoDot menyelenggarakan kelas sains dan matematika daring untuk anak. Platform memerlukan akun superadmin awal dari seeder. Superadmin mengelola admin; admin membuat akun teacher dan staff yang dapat login, mengatur kewenangan mereka, serta memantau kelas dan pembayaran. Teacher atau staff yang diberi izin perlu mengelola paket kelas, jadwal, harga, materi, tes, dan roster. Orang tua sebagai member mendaftar dan login secara mandiri, membuat profil sekaligus akun login anak, memilih kelas trial atau kelas berbayar, membayar melalui Midtrans, dan mengikuti perkembangan pendaftaran anak.

Kelas trial memiliki kapasitas maksimum empat anak terkonfirmasi per sesi. Kelas berbayar mempunyai kapasitas yang dapat dikonfigurasi. Baik trial maupun kelas berbayar harus mencegah pendaftaran ganda dan kelebihan peserta ketika beberapa orang tua membayar kursi terakhir hampir bersamaan.

### Proposed Solution

Bangun satu platform OttoDot dengan relasi operasional **superadmin → admin → teacher/staff → paket kelas/kelas**. Seeder membuat akun superadmin awal secara aman dan idempoten. Admin membuat dan menonaktifkan akun teacher/staff serta menetapkan cakupan pengelolaan; akun yang diaktifkan dapat login ke workspace masing-masing. Member mendaftar dan login mandiri, membuat profil anak sekaligus kredensial login terpisah untuk anak tersebut, lalu memilih trial atau paket kelas berbayar dan membayar sekali per pendaftaran melalui Midtrans. Anak login untuk mengakses kelas, materi, dan tes yang sudah dibayar/terkonfirmasi; checkout tetap dilakukan oleh member/orang tua.

Database OttoDot menyimpan status pendaftaran, pembayaran terverifikasi, dan ketersediaan kursi. Tampilan sisa kursi bersifat indikatif; kursi dikonfirmasi secara atomik setelah hasil pembayaran diverifikasi. Pembayaran yang berhasil ketika kursi sudah habis dicatat untuk refund atau rekonsiliasi dan tidak memberi akses kelas.

### Success Criteria

- Seeder menghasilkan tepat satu superadmin awal yang dapat login; seeder ulang tidak membuat akun duplikat atau mereset kredensial.
- Admin dapat membuat, mengatur izin, dan menonaktifkan teacher/staff; akun aktif dapat login dan hanya mengelola kelas yang ditugaskan.
- Member dapat register dan login mandiri, membuat satu atau lebih profil anak beserta akun login anak yang terhubung, dan hanya mendaftarkan anak di bawah akunnya.
- Anak dapat login dengan kredensial sendiri dan hanya mengakses kelas, materi, serta tes dari pendaftaran confirmed miliknya; anak tidak dapat checkout atau melihat pembayaran orang tua.
- Paket kelas trial dan berbayar menampilkan harga, jadwal, cakupan akses, dan kapasitas sebelum checkout.
- Tidak ada sesi trial dengan lebih dari empat anak terkonfirmasi; kelas berbayar tidak melebihi kapasitas yang dikonfigurasi.
- Anak yang sama tidak mempunyai dua pendaftaran aktif pada penawaran kelas yang sama.
- Pembayaran gagal atau belum terverifikasi tidak memasukkan anak ke roster atau membuka akses kelas.
- Dua pembayaran yang bersaing untuk kursi terakhir menghasilkan tepat satu pendaftaran terkonfirmasi; pembayaran lainnya masuk proses refund/rekonsiliasi.
- Dashboard superadmin, admin, teacher/staff, member, dan anak menampilkan data serta tindakan sesuai kewenangan.

## 2. User Experience & Functionality

### User Personas

- **Superadmin**: akun bootstrap dari seeder yang mengelola akun admin dan akses tingkat platform.
- **Admin**: membuat akun login teacher/staff, menetapkan izin dan penugasan kelas, mengawasi member, katalog, pendaftaran, pembayaran, dan kasus refund.
- **Teacher**: mengajar kelas yang ditugaskan; jika diberi izin, membuat dan mengelola paket kelas, sesi, materi, tes, dan roster.
- **Staff**: mengelola paket kelas, jadwal, harga, publikasi, roster, dan operasional pembayaran sesuai izin admin.
- **Member/orang tua**: register dan login mandiri, membuat profil serta akun anak, mencari kelas, membayar trial atau kelas berbayar, dan memantau status anak.
- **Anak/peserta**: login dengan akun sendiri untuk mengikuti kelas, mengerjakan tes, serta melihat materi dan hasil yang diizinkan.
- **Midtrans**: memproses checkout dan melaporkan perubahan transaksi melalui webhook.

### User Stories and Acceptance Criteria

#### Superadmin, akun operator, dan penugasan

As a superadmin or admin, I want to manage operator accounts and class permissions so that each person can log in and operate only the classes entrusted to them.

- Seeder membuat superadmin awal dengan identitas unik dan kredensial dari secret/environment yang aman; seeder ulang tidak menduplikasi akun atau mengganti password yang sudah dipakai.
- Superadmin dapat login dan membuat/mengelola akun admin. Admin dapat membuat, mengundang, mengaktifkan, menonaktifkan, serta mengubah peran teacher/staff.
- Teacher/staff yang dibuat memperoleh jalur aktivasi atau set password, lalu dapat login dengan akun sendiri; akun yang dinonaktifkan tidak dapat mempertahankan akses melalui sesi lama.
- Admin dapat menetapkan teacher atau staff ke satu atau lebih paket kelas/kelas dan memberi izin baca, kelola, atau mengajar sesuai kebutuhan.
- Admin, teacher, dan staff tidak dapat menaikkan perannya sendiri; teacher/staff tidak dapat membuat operator lain.
- Semua route dan aksi server memeriksa sesi, role, penugasan, dan kepemilikan resource; mengetahui ID kelas saja tidak memberi akses.
- Tindakan administratif sensitif mencatat actor, waktu, target, dan hasil.

#### Paket kelas dan publikasi

As an authorized teacher or staff member, I want to manage class packages and sessions so that parents can understand and enroll their children.

- Teacher/staff berwenang dapat membuat draft paket kelas dengan judul, deskripsi, rentang usia, harga, jadwal, teacher, materi ringkas, dan aturan akses.
- Paket dapat memiliki penawaran **TRIAL** dan **PAID**. Setiap penawaran yang dapat dibeli memiliki sesi/periode, harga, mata uang, kapasitas, dan kebijakan pendaftaran yang jelas.
- Kapasitas sesi trial paling banyak empat anak; kapasitas kelas berbayar ditetapkan admin/teacher/staff berwenang.
- Draft tidak muncul dalam katalog member. Publikasi, perubahan harga/jadwal penting, dan penutupan pendaftaran tercatat.
- Perubahan harga setelah checkout dibuat tidak mengubah snapshot harga pada pembayaran yang sudah berjalan.

#### Register member, akun anak, dan dashboard keluarga

As a parent, I want to register, create an account for each child, and enroll the child in the right class.

- Member dapat register, mengaktifkan akun bila diperlukan, login/logout, dan memulihkan kredensialnya sendiri.
- Member dapat membuat, melihat, serta memperbarui profil anak yang berada di bawah akunnya. Pembuatan profil juga membuat atau menautkan satu akun login anak secara satu-ke-satu; anak tidak mendaftar mandiri.
- Orang tua menetapkan atau mengaktifkan kredensial anak melalui alur aman, menerima identifier login anak yang unik, dan dapat mereset atau mencabut aksesnya. Kredensial anak tidak ditampilkan kembali sebagai teks biasa.
- Anak dapat login/logout melalui form yang jelas, membuka dashboard anak, dan melihat hanya kelas confirmed, materi, tes, serta hasil yang diizinkan untuk profilnya; anak tidak dapat mengubah profil wali, memilih pembayaran, atau melihat transaksi keluarga.
- Profil anak mencatat data minimum yang diperlukan untuk kelas dan pendaftaran; aksesnya dibatasi pada orang tua terkait serta admin/teacher/staff berwenang.
- Satu akun dapat memiliki beberapa anak; pemilihan anak wajib dilakukan sebelum checkout.
- Dashboard member menonjolkan trial, kelas berbayar, status pembayaran dan pendaftaran per anak, jadwal, tes, serta materi yang boleh diakses.
- Member dan anak tidak dapat mendaftarkan, membaca profil, atau memakai sesi milik keluarga lain melalui manipulasi request.

#### Penemuan dan pembayaran kelas trial

As a parent, I want to choose a trial session for my child and pay through Midtrans so that the child's place is confirmed only when payment and capacity allow it.

- Katalog menampilkan sesi trial terbit, jadwal, harga, teacher, kapasitas indikatif, dan aturan akses.
- Setelah member memilih anak dan sesi, sistem membuat pendaftaran `PENDING_PAYMENT` dan order Midtrans unik dengan nominal/mata uang yang disimpan sebagai snapshot.
- Pendaftaran pending tidak memakai kursi, tidak muncul dalam roster terkonfirmasi, dan tidak membuka akses kelas.
- Webhook pembayaran yang sah memicu konfirmasi kursi atomik. Pembayaran gagal, dibatalkan, atau kedaluwarsa tidak mengonfirmasi anak.
- Member melihat status pending, confirmed, gagal, kedaluwarsa, atau refund required beserta tindakan berikutnya.

#### Penemuan dan pembayaran kelas berbayar

As a parent, I want to buy a paid class package for a selected child so that the child can attend the included classes after payment succeeds.

- Katalog paket berbayar menampilkan harga, jadwal/periode, cakupan kelas, kapasitas, aturan pembatalan, dan kebijakan akses sebelum checkout.
- Checkout Midtrans membuat satu payment attempt untuk pendaftaran anak dan snapshot harga; harga tidak dihitung ulang dari katalog ketika callback tiba.
- Pendaftaran dan akses kelas baru aktif setelah webhook Midtrans terverifikasi dan kursi berhasil dikonfirmasi.
- Pembayaran gagal tidak memberi akses; dashboard menyimpan riwayat order, status uang, status pendaftaran, dan bukti yang diperlukan.
- Pendaftaran kelas berbayar menggunakan proteksi kursi terakhir yang sama dengan trial, dengan kapasitas sesuai paket/sesi yang dijual.

#### Kursi terakhir, pembatalan, dan refund

As a parent, I want an accurate enrollment outcome even if another parent pays for the last seat at the same time.

- Dua member boleh memulai checkout saat tampilan menunjukkan satu kursi tersisa. Pembayaran yang diproses dan berhasil mengunci kursi lebih dahulu mendapat status `CONFIRMED`.
- Jika pembayaran lain berhasil setelah kursi habis, status uang tetap tercatat berhasil, tetapi pendaftaran menjadi `REFUND_REQUIRED`, tidak masuk roster, dan tidak membuka akses kelas.
- Satu pembayaran berlebih menghasilkan satu kasus refund/rekonsiliasi. Metode bayar yang tidak mendukung refund otomatis ditangani manual dengan status yang dapat dipantau admin dan member.
- Webhook duplikat/terlambat, expiry pendaftaran, dan pembatalan tidak boleh menggandakan konfirmasi, melewati kapasitas, atau mengurangi counter dua kali.
- Kebijakan refund untuk pembatalan oleh member dan perubahan jadwal oleh OttoDot ditetapkan sebelum rilis pembayaran produksi.

#### Kelas, tes, dan dokumentasi

As a child and parent, we want the child's own login to access class activities while the parent can monitor progress.

- Teacher/staff melihat roster hanya untuk kelas yang ditugaskan; member memantau kelas anak dengan pendaftaran confirmed; anak mengakses kelasnya melalui sesi login sendiri.
- Tautan kelas daring dapat memakai provider eksternal; platform tidak membangun video conference sendiri.
- Teacher berwenang dapat menyiapkan tes online dan membaca hasil anak pada kelas yang ditugaskan.
- Anak dengan akun aktif dan pendaftaran confirmed dapat mengerjakan tes sesuai batas waktu dan aturan attempt; orang tua hanya melihat hasil bila kebijakan kelas mengizinkan.
- Materi kelas disimpan privat; permintaan unduh memeriksa pendaftaran dan izin di server, lalu memberi URL terbatas.
- Format/ukuran file, retensi, dan hasil tes yang boleh dilihat ditetapkan saat implementasi.

### Non-Goals

- Registrasi vendor, marketplace multi-vendor, subscription vendor, dan paket premium untuk membuat akun member.
- Subscription member bulanan atau auto-charge; pembayaran awal difokuskan pada satu pendaftaran trial atau paket kelas berbayar.
- Aplikasi mobile native, video conference buatan sendiri, payroll teacher, dan akuntansi penuh pada iterasi awal.
- AI sebagai syarat untuk registrasi, checkout, kapasitas, tes, atau penilaian.

## 3. AI System Requirements

### Tool Requirements

- AI tidak diperlukan untuk alur inti pendaftaran, pembayaran, konfirmasi kursi, akses kelas, atau penilaian.
- Bila OpenAI dipakai untuk membantu draft materi/soal, teacher harus meninjau hasil sebelum publikasi.

### Evaluation Strategy

- Uji bootstrap superadmin idempoten, login/penonaktifan teacher, register/login member, pembuatan/login anak, isolasi antar-keluarga, webhook idempotency, pendaftaran ganda, pembayaran gagal, dan race kursi terakhir pada trial maupun kelas berbayar.
- Pantau konversi trial, okupansi, keberhasilan pembayaran, refund terbuka, aktivitas kelas, tes, dan unduhan.
- Sampel audit memastikan roster, hasil tes, serta materi hanya terlihat oleh pengguna yang berhak.

## 4. Technical Specifications

### Architecture Overview

Arsitektur ExamAI sebagai acuan menggunakan TanStack Start dan React untuk aplikasi full-stack, Prisma dengan PostgreSQL untuk data, Better Auth untuk sesi/kredensial, Mantine dan Tailwind untuk UI, serta susunan feature-first di `src/features`. Alur ExamAI yang diberikan mencakup pembayaran Midtrans, pembuatan ujian, aktivasi murid melalui email, attempt, grading, hasil, notifikasi, dan sertifikat. Konsep organisasi, subscription, serta murid ExamAI tidak diadopsi sebagai model produk OttoDot.

OttoDot memakai satu katalog yang dikelola admin serta teacher/staff yang ditugaskan. Seeder membuat superadmin awal; superadmin mengelola admin, admin membuat teacher/staff, member register mandiri, dan member membuat akun anak yang terhubung ke profil anak. Batas otorisasi utamanya adalah role, penugasan paket/kelas, relasi orang tua–anak, akun anak, dan pendaftaran confirmed. Alur inti: superadmin/admin masuk → admin membuat teacher/staff yang dapat login → teacher/staff membuat dan menerbitkan paket kelas → member register/login dan membuat profil serta akun login anak → member memilih penawaran trial/berbayar → checkout Midtrans → webhook diverifikasi → kursi dikonfirmasi dalam transaksi database → anak login dan mengakses kelasnya.

Backend dan database lokal menjadi sumber kebenaran akses serta kapasitas; Midtrans menjadi sumber status transaksi eksternal. Redirect checkout atau perubahan UI tidak boleh langsung mengonfirmasi kursi.

### Integration Points

- **Database**: PostgreSQL/Prisma untuk akun superadmin/admin/teacher/staff/member/anak, relasi wali–anak, assignment, kelas, pendaftaran, pembayaran, audit, unique constraints, dan transaksi kapasitas.
- **Auth — Better Auth**: sesi dan kredensial terpisah untuk operator, member, dan anak; bootstrap superadmin lewat seeder. Alur login anak harus mendukung identifier unik yang dikelola wali tanpa mensyaratkan anak memiliki email pribadi.
- **Payment — Midtrans**: checkout satu kali per pendaftaran, webhook terverifikasi, pemeriksaan merchant/order/nominal/mata uang/status, Get Status untuk rekonsiliasi bila diperlukan, serta refund sesuai dukungan metode bayar.
- **Email — Mailtrap adapter**: aktivasi teacher/staff/member dan pemberitahuan ke wali tentang akun anak, konfirmasi pendaftaran, perubahan jadwal, hasil pembayaran, dan status refund; gunakan outbox durable serta retry. Email anak pribadi tidak diwajibkan.
- **Scheduler — `node-cron`**: expiry payment pending, pemulihan outbox, dan rekonsiliasi order/refund secara idempoten. Jadwal final ditetapkan saat implementasi.
- **Storage — Supabase Storage**: materi OttoDot memakai bucket privat sendiri; bucket `certificates` ExamAI hanya referensi teknis.
- **Dokumen**: `@react-pdf/renderer` dan ExcelJS adalah acuan ExamAI bila OttoDot memerlukan bukti pendaftaran atau ekspor roster.
- **AI — OpenAI**: opsional untuk draft materi/soal dengan tinjauan teacher sebelum publikasi.

Kontrak Midtrans mengikuti [dokumentasi notifikasi dan verifikasi signature](https://docs.midtrans.com/docs/https-notification-webhooks) serta [panduan refund](https://docs.midtrans.com/docs/how-can-i-refund-transaction). Dukungan refund dapat bergantung pada metode pembayaran dan aktivasi merchant; sediakan rekonsiliasi manual.

### Frontend Screens dan Template

Template HTML di `templates/` adalah acuan visual, bukan screen OttoDot yang sudah berfungsi. Implementasi mengadaptasinya menjadi route React/TanStack Start responsif dengan Mantine dan Tailwind:

- `landing-page.html`, `register.html`, dan `login.html`: katalog awal, register/login member, login operator, serta login anak.
- `dashboard-admin-overview.html`, `dashboard-admin-students.html`, dan template admin lain: pengelolaan akun, paket kelas, pembayaran, serta kasus refund.
- `dashboard-admin-exam-form.html` dan `dashboard-admin-exam-detail.html`: acuan form/detail paket kelas untuk teacher/staff.
- `student-exam-list.html` dan `student-exam.html`: acuan dashboard setelah anak login, daftar kelas/trial, serta tes.

Screen pembuatan akun teacher/staff, pembuatan profil dan kredensial anak, login anak, pemilihan anak, checkout Midtrans, status booking, roster kelas, dan refund dibuat mengikuti bahasa visual template tersebut. Setiap alur memiliki keadaan loading, kosong, pending, gagal, confirmed, dan kursi habis yang relevan.

### Key Data Model

Nama final dapat disesuaikan saat desain implementasi:

- **Identity**: `User` dengan role `SUPERADMIN`, `ADMIN`, `TEACHER`, `STAFF`, `MEMBER`, atau `CHILD`; `StaffAssignment`, `MemberProfile`, `ChildProfile`, `GuardianChild`. Setiap `ChildProfile` memiliki tepat satu akun `CHILD` yang dapat login dan terhubung ke wali melalui relasi yang tervalidasi.
- **Learning**: `ClassPackage`, `ClassSession`, `ClassOffering` (`TRIAL` atau `PAID`), `ClassMaterial`, `OnlineTest`, `TestAttempt`.
- **Enrollment/payment**: `Enrollment`, `PaymentAttempt`, `PaymentTransaction`, `PaymentWebhookEvent`, `RefundCase`.
- **Operations**: `AuditEvent`, `NotificationOutbox`.

`ClassOffering` adalah unit yang menjual kursi untuk satu anak dan menyimpan kapasitas serta `confirmed_count`. Penawaran trial dibatasi maksimal empat; penawaran berbayar mengikuti kapasitas yang ditetapkan. `Enrollment` menghubungkan anak dan penawaran dengan status `PENDING_PAYMENT`, `CONFIRMED`, `PAYMENT_FAILED`, `CANCELLED`, `EXPIRED`, atau `REFUND_REQUIRED`. Status uang disimpan terpisah dari status pendaftaran.

### Backend Operations and Invariants

- Seeder membuat akun `SUPERADMIN` awal secara idempoten menggunakan secret bootstrap, menolak kredensial default/hardcoded, dan tidak mereset kredensial saat dijalankan ulang. Superadmin dapat mengelola admin; admin membuat akun login teacher/staff dan assignment. Penonaktifan akun mencabut sesi aktif. Teacher/staff hanya mengelola paket/kelas yang ditugaskan dan sesuai izin.
- Member dapat register/login mandiri, membuat profil anak beserta akun `CHILD` satu-ke-satu, serta mengelola kredensial anak secara aman. Pembuatan profil dan akun anak dilakukan atomik agar tidak ada profil tanpa akun login atau akun tanpa wali.
- Member hanya dapat mengelola anak sendiri dan membeli penawaran yang terbit untuk anak tersebut. Akun anak hanya dapat mengakses kelas/tes/materi miliknya setelah enrollment confirmed; akun anak tidak dapat checkout, mengelola wali, atau melihat pembayaran.
- Checkout menyimpan order ID unik, payment attempt, snapshot harga/mata uang, anak, serta penawaran yang dipilih. Satu anak tidak boleh mempunyai dua enrollment aktif pada penawaran yang sama; gunakan partial unique index untuk status `PENDING_PAYMENT` dan `CONFIRMED`.
- Handler webhook Midtrans memverifikasi signature, merchant/order, nominal, mata uang, dan status; event/transisi dicatat dengan kunci deduplikasi. Callback yang sama, terlambat, atau di luar urutan tidak boleh mengulang efek bisnis.
- Setelah pembayaran sah, transaksi PostgreSQL mengunci baris `ClassOffering` dengan `SELECT ... FOR UPDATE`, memeriksa status enrollment serta `confirmed_count < capacity`, kemudian menaikkan counter dan mengubah enrollment ke `CONFIRMED` dalam transaksi yang sama. Conditional update atomik boleh dipakai bila semua jalur konfirmasi dan pembatalan konsisten. Read-count-then-write tanpa lock dilarang.
- Jika kursi habis atau enrollment sudah expired ketika pembayaran berhasil, pembayaran tetap dicatat, enrollment menjadi `REFUND_REQUIRED`, dan satu `RefundCase` dibuat. Anak tidak masuk roster maupun memperoleh akses.
- Pembatalan enrollment confirmed mengurangi counter paling banyak sekali di dalam transaksi; kebijakan pengembalian dana diproses terpisah dari pelepasan kursi.
- Uji paralel pada trial dan kelas berbayar dengan satu kursi tersisa harus menghasilkan tepat satu enrollment confirmed, counter tidak melewati kapasitas, satu kasus refund, dan hasil tetap sama setelah callback diulang.

### Security & Privacy

- Semua route memeriksa autentikasi, role, assignment teacher/staff, relasi orang tua–anak, identitas akun anak, status enrollment, dan hak akses kelas di server. Sesi anak dan wali tidak saling menggantikan; penonaktifan akun atau pencabutan akses anak berlaku pada sesi aktif.
- Secret bootstrap superadmin dan kredensial operator/anak tidak disimpan dalam source code atau log; password disimpan sebagai hash oleh sistem autentikasi dan reset memakai alur aman.
- Data anak dan roster diminimalkan; teacher/staff hanya melihat data yang diperlukan untuk kelas yang ditugaskan.
- Data kartu/rahasia pembayaran tetap di Midtrans; platform menyimpan reference serta metadata minimum.
- Aksi admin/staff sensitif dan transisi pembayaran/pendaftaran diaudit tanpa menyimpan kredensial atau rahasia.
- Materi dan hasil tes tidak diberi URL publik permanen; unduhan diperiksa pada setiap permintaan.

### Responsibility by Layer

- **UI**: menampilkan register/login member, login operator/anak, pembuatan akun anak, katalog, checkout, status, ketersediaan indikatif, roster, kelas, tes, dan materi.
- **Backend**: mem-bootstrap superadmin, membuat akun operator/anak, memeriksa izin, membuat checkout, memverifikasi webhook, mengatur transisi enrollment, akses kelas, dan refund case.
- **Database**: foreign key, unique constraint, transaksi kapasitas, idempotency, serta integritas status uang dan kursi.
- **Midtrans**: memproses pembayaran dan mengirim status transaksi; redirect browser bukan dasar pemberian akses.
- **Background worker**: expiry pending, outbox, rekonsiliasi pembayaran, dan tindak lanjut refund.

## 5. Risks & Roadmap

### Current Release

Belum ada implementasi OttoDot pada salinan repository lokal ini; yang tersedia adalah dokumen PRD dan template layar ExamAI. Detail teknis ExamAI di atas adalah konteks, bukan implementasi yang dapat langsung digunakan.

### Next Iterations

1. Tetapkan izin superadmin/admin/teacher/staff/member/anak, bootstrap seeder, identifier login anak, relasi wali–anak, cakupan assignment, dan kebijakan data anak.
2. Tetapkan struktur paket kelas, harga trial/berbayar, kapasitas kelas berbayar, aturan pembatalan, dan refund.
3. Bangun seeder superadmin, pembuatan/login teacher/staff, register/login member, pembuatan/login anak, dashboard peran, katalog kelas, dan pengelolaan paket memakai template.
4. Integrasikan checkout Midtrans dan webhook; implementasikan konfirmasi kursi atomik untuk trial serta kelas berbayar.
5. Tambahkan roster, akses kelas, materi privat, tes, outbox, monitoring, dan rekonsiliasi produksi.

### Assumptions to Confirm

- Member adalah akun orang tua/wali yang register sendiri; setiap anak mempunyai profil dan akun login terpisah yang dibuat oleh wali serta terhubung ke akun wali tersebut. Anak tidak memerlukan email pribadi.
- Seeder menghasilkan superadmin awal; superadmin membuat/mengelola admin. Admin membuat teacher/staff dan menentukan izin; teacher/staff tidak mendaftar sebagai operator secara mandiri.
- Trial berbayar memiliki kapasitas maksimum empat anak per sesi. Harga, batas trial per anak, dan kapasitas kelas berbayar ditetapkan produk.
- Pembelian trial dan paket kelas berbayar adalah transaksi satu kali per pendaftaran. Masa akses paket berbayar, pajak, serta perubahan jadwal perlu ditetapkan.
- Kebijakan refund otomatis/manual bergantung pada metode bayar Midtrans serta konfigurasi merchant.
- Kebijakan retensi profil anak, materi, dan hasil tes perlu ditetapkan sebelum rilis.

### Technical Risks and Mitigations

- **Bootstrap dan akses akun**: seeder idempoten, secret aman, aktivasi operator, serta pencabutan sesi akun nonaktif diuji.
- **Akses data anak**: guard relasi wali–anak, akun login anak, dan assignment kelas diuji pada setiap route serta aksi server.
- **Race kursi terakhir**: konfirmasi diserialisasi per penawaran dengan row lock/conditional update, bukan hitung lalu tulis biasa.
- **Pembayaran berhasil ketika kursi habis**: uang dan enrollment disimpan sebagai state terpisah; buat refund case dan jangan beri akses.
- **Webhook duplikat/terlambat**: verifikasi signature/status, deduplikasi event, transisi idempoten, dan rekonsiliasi berkala.
- **Refund tidak didukung metode bayar**: kasus tetap terbuka untuk penanganan manual dan statusnya terlihat admin/member.
- **Perubahan harga/jadwal saat checkout berjalan**: simpan snapshot order dan terapkan kebijakan perubahan yang eksplisit.

