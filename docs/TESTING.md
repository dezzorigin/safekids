# TESTING.md — SafeKids

## 1. Yang diuji otomatis (CI)

`.github/workflows/ci.yml` — 8 job, semua harus hijau sebelum merge:

| Job | Isi |
|---|---|
| `build` | `npm ci` (lockfile ada) → `npm run build` (`tsc && vite build`) |
| `typecheck` | `tsc --noEmit` (juga bagian dari build, dijalankan terpisah supaya pesannya jelas) |
| `lint` | `npm run lint` (`eslint .`) — **0 error**; 30 warning yang didokumentasikan (lihat §4) |
| `advisory-sweep` | `scripts/advisory-sweep.py` — OSV atas 15 dependensi produksi; HIGH/CRITICAL = gagal. Bukan `npm audit` (itu melaporkan advisory dev-only sebagai temuan produksi) |
| `static-checks` | Gate P0 anti-slop di `index.html` + `src/pages/WelcomePage.tsx` (nol gradient hero, nol emoji di landing, tag OG/Twitter lengkap) + `og-image.png` ada, 1200×630, ≥ 10 KB |
| `playwright-e2e` | `e2e/landing.spec.ts` — desktop (1280×800) + mobile **Pixel 7** (bukan iPhone: WebKit tidak ter-install di CI, hanya Chromium) |
| `gitleaks` | Secret scan riwayat penuh (`fetch-depth: 0`) + `.gitleaks.toml` |
| `smoke` | File yang di-deploy ada & tidak kosong: `dist/index.html`, `dist/og-image.png`, `dist/compass.svg`, `dist/_redirects` |

## 2. E2E (Playwright)

`e2e/landing.spec.ts` — 6 tes:

1. Landing tampil: judul, hero 2 kolom, panel peta evakuasi, CTA guru/siswa, tautan GitHub.
2. Pemilih level peta mengganti data (BFS asli): Gempa → Tsunami (timer 75 detik muncul, jumlah langkah berubah) → Banjir.
3. Fitur + alur: 6 langkah; kartu simulator dan langkah "Evacuation 3D" membuka `/simulator`.
4. CTA guru membuka `/admin/login`.
5. Footer: kredit Najwa Azzahra + NIM + tautan GitHub + panduan.
6. Mobile 390px (Pixel 7): tanpa scroll horizontal.

Jalankan lokal (butuh browser Playwright — **tidak bisa di VM dev**,
Chrome lokal tidak bisa start; jalankan di CI atau mesin sendiri):

```bash
npm ci
npx playwright install --with-deps chromium
npm run build
npm run e2e
```

Server lokal tes adalah `python3 -m http.server 8511 --directory dist`
(pola rantai #46–#48). `npx vite preview` JANGAN dipakai: run CI
pertama repo ini gagal total di langkah webServer — "Timed out waiting
60000ms from config.webServer" (run 44512978467) — preview tidak pernah
menjawab di 127.0.0.1:8511. Tes hanya navigasi via klik (client-side
routing), jadi tanpa SPA fallback pun cukup.

## 3. Verifikasi lokal (yang BISA dilakukan di VM dev)

```bash
npm ci --no-bin-links --ignore-scripts   # pola VM: npm biasa gagal EPERM chown
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/vite/bin/vite.js build
python3 scripts/advisory-sweep.py
python3 -m http.server 8511 --directory dist --bind 127.0.0.1
# lalu cek root 200 + og-image.png 200 image/png (pakai UA browser;
# UA default python kena 403 Cloudflare saat cek live)
```

Catatan: `npm ci` biasa (dengan bin-links) gagal di VM ini dengan
`EPERM chown` pada file biner — flag `--no-bin-links` menghindarinya;
biner dipanggil langsung via `node node_modules/.../bin/...`. Di CI,
`npm ci` biasa dipakai (tanpa flag itu).

## 4. Utang teknis yang diketahui (dicatat, bukan diumpetkan)

1. **Hook kondisional (30 warning lint).** `AdminDashboard.tsx` dan
   `MapGrid.tsx` memanggil hook di dalam blok kondisional
   (`react-hooks/rules-of-hooks` + `exhaustive-deps` diturunkan ke
   `warn` di `eslint.config.mjs`). Kondisinya stabil per sesi sehingga
   aplikasi jalan, tapi merapikannya butuh restrukturisasi dashboard
   guru — di luar lingkup PR proper ini.
2. **Mode demo Supabase.** Tanpa kredensial, login guru dan
   sinkronisasi data kelas tidak aktif (Supabase Auth menolak
   placeholder). Semua fitur siswa (simulator, kuis, refleksi, team
   maker) jalan penuh secara lokal. Login guru hanya bisa diuji
   end-to-end dengan kredensial proyek Supabase sendiri.
3. **Chunk simulator ±1 MB** (gzip ±292 KB). Sudah lazy-load; belum
   dipecah lebih jauh (manualChunks).

## 5. Batas verifikasi yang jujur

- **Adegan 3D tidak bisa diuji headless dari VM** (Chrome lokal tidak
  bisa start). Yang terverifikasi: build lolos, chunk simulator
  terbentuk, e2e CI membuka `/simulator` (lazy-load jalan), dan logika
  level (BFS, rintangan, timer) teruji lewat panel peta di landing.
  Cek visual adegan 3D dari browser live adalah follow-up.
- **Screenshot README + video demo** adalah follow-up browser live
  (lihat README) — bukan gate merge.
- **Tautan panduan PDF** (storage Supabase penulis) tidak bisa
  diverifikasi dari VM (koneksi ditutup saat HEAD); tautan
  dipertahankan apa adanya dari kode asli.
