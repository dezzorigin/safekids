# PRD — SafeKids

## 1. Informasi Proyek

| Field | Nilai |
|---|---|
| Nama Proyek | SafeKids |
| Deskripsi | Media pembelajaran evakuasi bencana interaktif untuk siswa SD |
| Tech Stack | Vite 5 + React 18 + TypeScript + React Three Fiber + Supabase |
| Status | Proper (v0.2.0) — live di Cloudflare Pages |
| Pemilik | Najwa Azzahra — NIM 240209050, PGMI UIN Ar-Raniry 2026 |
| Pengembang | Nabil Aulia Dika (dezzorigin) |
| Versi Dokumen | 2.0 (19 Nov 2026) |
| Bahasa | Bahasa Indonesia |

## 2. Latar Belakang

Siswa sekolah dasar di daerah rawan bencana (Aceh: tsunami 2004 masih
menjadi memori kolektif) perlu tahu ke mana harus lari dan apa yang harus
dilakukan saat alarm berbunyi — bukan dari ceramah saja, tapi dari latihan
yang mereka mainkan sendiri. SafeKids membungkus materi evakuasi gempa,
banjir, dan tsunami ke dalam satu sesi kelas ±90 menit yang dipandu guru:
dari peta konsep, pembagian kelompok, video, ice breaking, simulasi 3D,
sampai kuis dan refleksi.

## 3. Masalah yang Diselesaikan

- Materi evakuasi bencana biasanya ceramah satu arah; siswa hafal
  definisi tapi tidak tahu rute selamat dari kelasnya sendiri.
- Guru tidak punya alat yang menyatukan video, simulasi, kuis, dan
  rekap nilai dalam satu alur sesi.
- Media pembelajaran yang ada menuntut instalasi atau akun berbayar;
  SafeKids jalan di browser, tanpa instalasi, tanpa akun untuk siswa.

## 4. Tujuan & Sasaran

- Satu sesi kelas tuntas dalam 6 langkah ±90 menit.
- Siswa menyelesaikan minimal 1 level simulasi 3D (mencapai titik aman).
- Guru mendapat rekap skor tiap kelompok yang bisa diekspor (PDF/Word).
- Aplikasi jalan penuh dalam mode demo (tanpa kredensial Supabase).

## 5. Ruang Lingkup

### In Scope
- Landing (hero 2 kolom + panel peta evakuasi interaktif, fitur, alur,
  peta konsep, strip guru, footer) — lihat `docs/DESIGN.md`.
- Alur siswa: splash → pilih kelompok → misi → kosakata → video →
  tutorial/ice break → simulator 3D → evaluasi → refleksi.
- Simulator 3D: 3 level (gempa, banjir, tsunami), grid 10×10, avatar,
  perintah maju/belok, rintangan, titik aman, timer tsunami 75 detik.
- Dashboard guru: rekap kelompok, kuis, refleksi; ekspor PDF/Word.
- Mode demo: semua fitur lokal jalan tanpa Supabase; login guru +
  sinkronisasi data aktif bila kredensial proyek sendiri diisi.

### Out of Scope
- Akun siswa dengan password (siswa masuk via pilihan kelompok).
- Backend sendiri (sinkronisasi memakai Supabase bila dikonfigurasi).
- Konten video buatan sendiri (video bencana memakai tautan video
  yang sudah dipilih guru di modul video).
- Aplikasi mobile native.

## 6. Fitur & Persyaratan Fungsional

| # | Fitur | Rute | Keterangan |
|---|---|---|---|
| F1 | Landing + peta evakuasi interaktif | `/` | Pilih level gempa/banjir/tsunami; rute terpendek dihitung BFS dari data level asli; tautan ke semua modul |
| F2 | Splash siswa + pilih kelompok | `/student/login`, `/student/group` | Tanpa password; kelompok disimpan di sessionStorage |
| F3 | Mission briefing | `/mission`, `/mission/:toolId` | 6 langkah sesi |
| F4 | Vocabulary lab | `/vocabulary` | Kosakata bencana |
| F5 | Disaster video | `/video` | Video Tsunami Aceh vs Jepang |
| F6 | Tutorial & ice break | `/tutorial` | Video AR + lagu ice breaking |
| F7 | Simulator 3D | `/simulator` | R3F; 3 level; perintah antrean; log instruksi; menang/kalah |
| F8 | Evaluasi (kuis) | `/evaluation` | Soal per level, skor langsung |
| F9 | Team maker (spin wheel) | `/teammaker` | Bagi kelompok acak via canvas |
| F10 | Refleksi word cloud | `/reflection` | Satu kata per siswa → awan kata kelas |
| F11 | Dashboard guru | `/dashboard-guru` | Butuh login (Supabase Auth); rekap + ekspor PDF/Word |
| F12 | Login guru | `/admin/login` | Supabase Auth email+password |

### Aturan main simulator (dari `src/store/useSimulationStore.ts`)
- Grid 10×10; start dan titik aman berbeda per level; rintangan
  (reruntuhan/rumah terendam) dan pagar pohon memblokir petak.
- Perintah: maju, mundur, belok kiri, belok kanan — dieksekusi antrean.
- Tsunami: 2 titik aman, ombak datang dalam 75 detik.
- Menang = mencapai titik aman; kalah = waktu habis / langkah buntu.

## 7. Persyaratan Non-Fungsional

- **Performa:** build Vite; chunk simulator lazy-load (±1 MB, gzip ±292 KB);
  landing interaktif tanpa menunggu chunk 3D.
- **Keamanan:** rahasia (`.env`) tidak boleh ter-commit (lihat
  `.env.example`); Supabase memakai anon key + placeholder bila kosong;
  CI menjalankan advisory-sweep OSV atas dependensi produksi.
- **Aksesibilitas:** focus-visible, aria-label tombol ikon, tag semantik,
  `prefers-reduced-motion` dihormati, target sentuh ≥ 44px, tanpa scroll
  horizontal di 390px.
- **Portabilitas:** browser modern apa pun; mode demo tanpa backend.

## 8. Arsitektur & Tech Stack

Lihat `docs/ARCHITECTURE.md` + `docs/diagram.html`. Ringkas: Vite SPA
(React Router, Zustand, React Three Fiber), Supabase opsional (Auth +
sinkronisasi), deploy statis Cloudflare Pages dengan SPA fallback
(`public/_redirects`).

## 9. Milestone / Roadmap

| Fase | Status |
|---|---|
| Inisialisasi & scaffolding | ✅ |
| Pengembangan fitur inti (12 fitur di atas) | ✅ |
| Landing rebuild anti-slop + CI + deploy Pages | ✅ (v0.2.0, 19 Nov 2026) |
| Screenshot + video demo dari browser live | ⏳ follow-up (lihat README) |
| Cek adegan 3D dari browser live | ⏳ follow-up |
| Rapikan conditional hooks di AdminDashboard/MapGrid | ⏳ utang teknis (lihat docs/TESTING.md) |

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Kredensial Supabase bocor | `.gitignore` + `.env.example`; mode demo tanpa kredensial |
| Dependency usang/rentan | advisory-sweep OSV di CI (HIGH/CRITICAL = gagal) |
| Chunk 3D besar (±1 MB) | Lazy-load route `/simulator`; landing tidak memuatnya |
| Login guru gagal tanpa Supabase | Pesan error dari Supabase ditampilkan; mode demo tetap jalan untuk siswa |

## 11. Kriteria Keberhasilan

- `npm run build` (tsc + vite) hijau; `npm run lint` 0 error; e2e
  Playwright hijau (desktop + Pixel 7).
- Landing: semua tombol/link membuka rute yang ada; panel peta
  menghitung rute dari data level asli.
- Live: root 200, tag OG/Twitter lengkap, `og-image.png` 200 image/png.
- Tidak ada secret ter-commit (gitleaks di CI).

## 12. Lampiran

- Desain: `docs/DESIGN.md` (referensi Mentorix, Dribbble).
- Arsitektur: `docs/ARCHITECTURE.md`, `docs/diagram.html`.
- Testing: `docs/TESTING.md`. Deploy: `docs/DEPLOY.md`.
- Lisensi: MIT (`LICENSE`).
