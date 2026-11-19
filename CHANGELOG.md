# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Catatan: entri sebelum 0.2.0 adalah template filler (menyebut Next.js
> dan "parental control" yang tidak pernah ada di repo ini — aplikasinya
> Vite + React Three Fiber). Riwayat yang benar dimulai dari 0.2.0.

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
