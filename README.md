# OttoDot

Fondasi aplikasi OttoDot untuk issue [#23](https://github.com/master23rd/ottodot-ai/issues/23). Tahap ini menyediakan login dan dashboard superadmin. Pendaftaran member, pengelolaan guru/kelas, trial, dan pembayaran ada di issue lanjutan.

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

Untuk build produksi, jalankan `npm run build` dan `npm start` dengan environment yang sama. Atur `BETTER_AUTH_URL` ke origin publik aplikasi. Jangan commit `.env`.

## Pemeriksaan

`npm run typecheck` memeriksa TypeScript. `npm test` menjalankan pengujian seeder dan keputusan akses dashboard. Build dapat diperiksa dengan `npm run build` setelah Prisma Client dihasilkan.

Route `/dashboard` memeriksa sesi Better Auth dan membaca role terbaru dari database di server. Pengguna tanpa sesi dialihkan ke `/login`; akun selain superadmin dialihkan ke `/unauthorized`. Signup publik dimatikan pada tahap fondasi ini.
