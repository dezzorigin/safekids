# ARCHITECTURE.md — SafeKids

## 1. Gambaran

SafeKids adalah Vite SPA (React 18 + TypeScript) tanpa backend sendiri.
Semua logika sesi berjalan di browser; Supabase dipakai **opsional**
untuk login guru (Auth) dan sinkronisasi data kelas. Tanpa kredensial,
aplikasi memakai placeholder dan berjalan dalam **mode demo** — semua
fitur lokal (simulator 3D, kuis, refleksi, team maker) tetap jalan.

```
Browser ──► Cloudflare Pages (statis: dist/) ──► React Router (SPA)
   │                                                    │
   ├─► Simulator 3D (React Three Fiber, lazy chunk)      │
   ├─► Zustand store (sesi simulasi, kelompok)           │
   └─► Supabase (opsional) ──► Auth guru + sinkronisasi
```

Diagram visual (HTML+SVG): `docs/diagram.html`.

## 2. Stack

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| Build | Vite 5 + `@vitejs/plugin-react` | `npm run build` = `tsc && vite build` |
| UI | React 18, React Router 6, Tailwind 3 | Token neo-brutalist di `tailwind.config.js` |
| 3D | React Three Fiber 8 + drei 9 + three 0.169 | Canvas di `src/components/3d/` |
| State | Zustand 4 | `src/store/useSimulationStore.ts` |
| Animasi | Framer Motion 11 | Transisi halaman (`PageTransition`) |
| Data | Supabase JS 2 | `src/lib/supabaseClient.ts` (placeholder bila kosong) |
| Ekspor | jspdf + jspdf-autotable, docx, file-saver | Rekap guru → PDF/Word |
| Ikon | lucide-react | SVG satu bobot; nol emoji di beranda |
| E2E | Playwright 1.65 | `e2e/landing.spec.ts`, desktop + Pixel 7 |

## 3. Struktur

```
index.html                  # shell SPA + meta OG/Twitter + font
public/
  compass.svg               # favicon (kompas)
  og-image.png              # kartu preview 1200×630 (dibuat scripts/make-og-image.py)
  _redirects                # SPA fallback Pages: /* → /index.html 200
src/
  main.tsx                  # entry React
  App.tsx                   # routing (lihat §4)
  index.css                 # Tailwind + token + a11y
  context/                  # AuthContext (Supabase), CurtainContext (transisi tirai)
  store/useSimulationStore.ts  # LEVELS (gempa/banjir/tsunami), status game, BFS
  components/
    3d/                     # Avatar, Environment, MapGrid (peta 10×10)
    layout/                 # MainLayout, Sidebar, TopNavigation, Drawer, TeacherRoute
    ui/                     # Button, Card, Badge, Modal, ConceptMap, InstructionPanel, ...
  pages/                    # 14 halaman (lihat §4)
  lib/                      # supabaseClient, studentSession (sessionStorage)
scripts/
  advisory-sweep.py         # OSV atas 15 dependensi produksi
  make-og-image.py          # generator og-image.png (PIL)
e2e/landing.spec.ts         # Playwright
.github/workflows/ci.yml    # build, typecheck, lint, advisory, static, e2e, gitleaks, smoke
```

## 4. Routing (`src/App.tsx`)

| Rute | Halaman | Akses |
|---|---|---|
| `/` | WelcomePage (beranda asli produk) | publik |
| `/student/login` | StudentLoginPage (splash + tirai) | publik |
| `/student/group` | StudentGroupPage | publik (pilih kelompok) |
| `/mission`, `/mission/:toolId` | MissionBriefing | dalam MainLayout |
| `/vocabulary` | VocabularyLab | dalam MainLayout |
| `/video` | DisasterVideo | dalam MainLayout |
| `/tutorial` | TutorialIceBreak (lazy) | dalam MainLayout |
| `/simulator` | Simulator (lazy, chunk 3D) | dalam MainLayout |
| `/evaluation` | Evaluation | dalam MainLayout |
| `/teammaker` | TeamMaker | dalam MainLayout |
| `/reflection` | ReflectionPage | dalam MainLayout |
| `/admin/login` | AdminLoginPage | publik |
| `/dashboard-guru` | AdminDashboard (lazy) | `TeacherRoute` (butuh login) |
| `*` | 404 di MainLayout | — |

`TeacherRoute` mengarahkan ke `/admin/login` bila belum login.
`AdminDashboard`, `TutorialIceBreak`, dan `Simulator` di-lazy-load
supaya landing tidak menunggu chunk 3D (±1 MB).

## 5. Data & state

- **Level simulasi** — `LEVELS` di `useSimulationStore.ts`: grid 10×10,
  start, titik aman (goals), rintangan (obstacles), pagar pohon
  (treeCoords), api (fireCoords, kosong di semua level saat ini).
- **Sesi siswa** — kelompok dipilih disimpan di `sessionStorage`
  (`src/lib/studentSession.ts`); `AuthContext` membedakan guru
  (login Supabase) vs siswa (punya kelompok, tanpa login).
- **Sinkronisasi** — store + halaman memanggil Supabase bila
  kredensial tersedia; bila placeholder, pemanggilan gagal dengan
  tenang (ditangkap) dan fitur lokal tetap jalan. Lihat
  `docs/TESTING.md` soal batas mode demo.
- **Tidak ada database lokal / file data** — konten kuis, kosakata,
  dan materi berada di dalam kode halaman masing-masing.

## 6. Build & deploy

- Build: `npm ci` (lockfile ada) → `npm run build` → `dist/`
  (2,5 MB; chunk terbesar `Simulator-*` ±1 MB).
- Deploy: Cloudflare Pages direct-upload via
  `~/workspace/github-actions/cf_pages.py` (lihat `docs/DEPLOY.md`).
  SPA fallback lewat `public/_redirects`.
- Font: Nunito (display/body) + JetBrains Mono (label/data) dari
  Google Fonts; tanpa font itu, fallback sistem tetap tampil.

## 7. Keputusan yang sengaja diambil

- **Mode demo sebagai default.** Repo ini dulu menyimpan kredensial
  di riwayat (sudah di-rewrite, P3 18 Nov 2026); keputusan pemilik:
  tidak ada rotasi/pengejaran kredensial, dan tidak ada kredensial
  nyata di repo. Supabase hanya aktif dengan kredensial proyek
  sendiri (lihat `.env.example`).
- **Chunk 3D lazy.** Simulator adalah chunk terbesar; landing dan
  halaman non-3D tidak memuat three.js.
- **Neo-brutalism dipertahankan** dari aplikasi asli (token
  `brutal-*` di Tailwind) karena sudah nyambung dengan dunia
  anak-anak; beranda diperbaiki seperlunya saja (emoji → ikon Lucide)
  mengikuti `docs/DESIGN.md` — tanpa rebuild jadi landing SaaS
  (arah Nabil 19 Nov 2026, mode AUDIT-FIX).
