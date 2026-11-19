# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Catatan: entri sebelum 0.2.0 adalah template filler (menyebut Next.js
> dan "parental control" yang tidak pernah ada di repo ini — aplikasinya
> Vite + React Three Fiber). Riwayat yang benar dimulai dari 0.2.0.

## [0.2.1] - 2026-11-19

### Changed — REVERT pola landing SaaS (arah baru Nabil 19 Nov 18:28, mode AUDIT-FIX)
- `src/pages/WelcomePage.tsx` dikembalikan ke beranda ASLI produk
  (hero + 3 kartu quick-start + panduan PDF + CTA guru/siswa + peta
  konsep + alur 6 langkah + footer). Panel "Peta Evakuasi" interaktif,
  strip ticker, fitur asimetris, dan strip "Untuk Guru" dari PR #1
  DIHAPUS — itu landing tentang app, bukan app itu sendiri.
- Satu-satunya perbaikan UI yang dipertahankan dari PR #1: emoji
  mentah di beranda diganti ikon Lucide SVG (pelanggaran P0 anti-slop);
  struktur dan copy asli dipertahankan. Footer ditambah tautan GitHub
  (higiene repo).
- `index.html`: judul + deskripsi dikembalikan ke kata-kata asli
  penulis ("SafeKids — Disaster Evacuation Learning Media"); tag
  OG/Twitter dipertahankan.
- `docs/DESIGN.md` ditulis ulang: tur referensi Mentorix dicatat,
  clone SaaS-nya DITOLAK; kontrak sekarang = bahasa desain asli produk.
- `public/og-image.png` digambar ulang dengan kata-kata asli produk
  ("Interactive Disaster Evacuation Learning Media" +
  "Learn. Simulate. Stay Safe.").
- `e2e/landing.spec.ts` ditulis ulang untuk beranda asli (5 tes);
  `scripts/check-static.mjs` mendapat gate anti-SaaS (frasa pola lama
  = gagal) + pengecualian tercatat untuk pola garis rambu hero.
- README, PRD, ARCHITECTURE, TESTING, DEPLOY, diagram dibersihkan
  dari klaim panel peta/BFS di landing.

### Fixed
- (Tidak ada bug fungsional baru — revert ini mengembalikan perilaku
  beranda ke yang penulisnya bangun.)

## [0.2.0] - 2026-11-19

### Added
- Landing rebuild anti-slop (`src/pages/WelcomePage.tsx`): navbar sticky
  + tautan GitHub, hero 2 kolom, panel Peta Evakuasi interaktif (pilih
  level gempa/banjir/tsunami, rute terpendek dihitung BFS dari data
  level asli), strip ticker, fitur asimetris, alur 6 langkah, peta
  konsep, strip "Untuk Guru", footer 2 kolom. Nol emoji di landing;
  ikon Lucide SVG.
- Kontrak desain di `docs/DESIGN.md` (referensi: Mentorix, Dribbble).
- Dokumen lengkap di `docs/`: PRD, ARCHITECTURE, TESTING, DEPLOY,
  `diagram.html` (diagram arsitektur HTML+SVG, bukan Mermaid).
- CI `.github/workflows/ci.yml` (8 job): build, typecheck, lint,
  advisory-sweep OSV, static-checks (gate P0 + OG), e2e Playwright
  (desktop + Pixel 7), gitleaks, smoke.
- E2E `e2e/landing.spec.ts` (6 tes) + `playwright.config.ts`.
- `scripts/advisory-sweep.py` (OSV, 15 dependensi produksi) dan
  `scripts/make-og-image.py` (PIL, 1200×630).
- Meta OG/Twitter lengkap di `index.html` + `public/og-image.png`
  (44 KB) + `public/compass.svg` (favicon — sebelumnya 404).
- `public/_redirects` — SPA fallback Cloudflare Pages (`/* → /index.html 200`).
- `.env.example` — mode demo didokumentasikan (placeholder Supabase).
- `eslint.config.mjs` (flat config ESLint 9) — script `lint` lama
  memakai `--ext` yang sudah dihapus ESLint 9 dan tanpa file config.

### Changed
- README ditulis ulang dari template menjadi README standar (cara
  main, simulator, mode demo, struktur, tautan docs).
- PRD ditulis ulang dari template generik menjadi PRD nyata (12 fitur,
  aturan main simulator, kriteria keberhasilan).
- `package.json`: script `lint` diperbaiki, tambah `e2e` dan
  `advisory-sweep`; tambah devDependency `@playwright/test` (lockfile
  diperbarui).

### Fixed
- Dua `catch (_)` kosong di `Simulator.tsx` (optional catch binding).
- Dua `eslint-disable` tak terpakai di `TeamMaker.tsx`.

### Known issues
- 30 warning lint (hook kondisional di `AdminDashboard`/`MapGrid` +
  `exhaustive-deps`) — utang teknis, lihat `docs/TESTING.md` §4.
- Login guru + sinkronisasi Supabase tidak aktif tanpa kredensial
  (mode demo).

## [0.1.0] - 2026

### Added
- Aplikasi awal: Vite + React Three Fiber + Supabase — simulator
  evakuasi 3D (gempa, banjir, tsunami), misi, kosakata, video,
  tutorial, evaluasi, team maker, refleksi, dashboard guru.
