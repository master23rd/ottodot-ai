# OttoDot

Fondasi aplikasi OttoDot untuk issue [#23](https://github.com/master23rd/ottodot-ai/issues/23) dan [#24](https://github.com/master23rd/ottodot-ai/issues/24). Superadmin dapat membuat dan mengelola akun admin; admin mengaktifkan kata sandinya sendiri lalu masuk ke ruang kerja operasional. Pendaftaran member, pengelolaan guru/kelas, trial, dan pembayaran ada di issue lanjutan.

## Prasyarat

- Node.js 22 atau lebih baru
- PostgreSQL yang dapat diakses dari mesin aplikasi

## Menjalankan lokal

1. Jalankan `npm ci`.
2. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL`, `BETTER_AUTH_SECRET` (minimal 32 karakter acak), `BETTER_AUTH_URL`, `SUPERADMIN_EMAIL`, dan `SUPERADMIN_PASSWORD` (minimal 16 karakter unik). Jangan gunakan nilai contoh untuk secret atau password.
3. Buat database PostgreSQL sesuai `DATABASE_URL`.
4. Jalankan `npm run db:generate` dan `npm run db:migrate`.
5. Jalankan `npm run db:seed`. Perintah ini membuat tepat satu superadmin. Menjalankannya lagi dengan email yang sama tidak mengubah kata sandi. Email yang berbeda akan ditolak.
6. Jalankan `npm run dev`, lalu buka `http://localhost:3000/login` dan masuk dengan kredensial superadmin.

## Akun admin

1. Masuk sebagai superadmin dan buka **Akun admin** dari dashboard.
2. Buat akun dengan nama dan email unik. Aplikasi langsung mengirim tautan aktivasi sekali pakai ke alamat admin melalui SMTP. Status pengiriman terlihat pada daftar akun.
3. Admin membuka tautan dalam 48 jam dan menetapkan kata sandi minimal 16 karakter. Setelah itu admin dapat masuk di `/login` dan diarahkan ke `/admin`.
4. Superadmin dapat menonaktifkan akun dari daftar. Sesi lama langsung dicabut. Reaktivasi mengizinkan admin memakai kata sandi yang sudah dibuat. Untuk email gagal atau tautan kedaluwarsa, gunakan **Kirim ulang email**; tautan lama langsung tidak berlaku.

Perubahan akun dan hasil pengiriman email tampil pada daftar aktivitas. Token aktivasi disimpan sebagai hash di database dan tidak dicatat dalam audit. Atur `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, dan `MAIL_FROM_NAME` di `.env`; jalankan `npm run mail:verify` untuk memeriksa koneksi SMTP tanpa mengirim pesan.

Untuk build produksi, jalankan `npm run build` dan `npm start` dengan environment yang sama. Atur `BETTER_AUTH_URL` ke origin publik aplikasi. Jangan commit `.env`.

## Pemeriksaan

`npm run typecheck` memeriksa TypeScript. `npm test` menjalankan pengujian seeder dan keputusan akses. Build dapat diperiksa dengan `npm run build` setelah Prisma Client dihasilkan.

Route `/dashboard` memeriksa sesi Better Auth dan membaca role terbaru dari database di server. Pengguna tanpa sesi dialihkan ke `/login`; akun selain superadmin dialihkan ke `/unauthorized`. Signup publik dimatikan pada tahap fondasi ini.
