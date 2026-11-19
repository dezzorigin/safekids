# DESIGN.md — SafeKids (kontrak arah desain, repo P1 #51)

Ditulis SEBELUM coding (standar anti-slop P1, 19 Nov 2026).
**Revisi 19 Nov 2026 ~18:30 WIB (arah baru Nabil — mode AUDIT-FIX):**
pola rebuild jadi landing page SaaS DIBATALKAN. Versi pertama kontrak
ini (referensi Mentorix, hero 2 kolom, panel peta evakuasi, fitur
asimetris, ticker) sudah sempat di-merge sebagai PR #1 — dan
**di-revert** oleh PR #2. Yang berlaku sekarang: UI ASLI produk
sebagaimana penulisnya membangunnya; yang diperbaiki hanya pelanggaran
P0 anti-slop di UI itu sendiri (emoji mentah → ikon Lucide SVG).
Tidak ada landing SaaS, tidak ada fitur karangan, tidak ada data contoh
yang dipajang sebagai data asli.

## 1. Referensi — tur dilakukan, clone SaaS DITOLAK

Tur referensi (19 Nov 2026, sebelum arah baru):
- **Mentorix — Neobrutalism Online Education Platform Landing Page**
  (Dribbble, Relyn LLC) —
  https://dribbble.com/shots/27538236-Mentorix-Neobrutalism-Online-Education-Platform-Landing-Page
- Kandidat kalah: Rocket "Syllabus" (terlalu korporat), Rocket "Sprout"
  (nada daycare, palet terlalu dekat dengan repo #48).

Keputusan setelah arah baru Nabil (18:28 WIB): **jangan clone
Mentorix.** SafeKids sudah punya bahasa desain sendiri yang nyambung
dengan dunianya (kelas SD, rambu evakuasi, stempel): kertas + kuning
rambu + koral alarm + mint aman, border tebal, bayangan keras, stempel
nomor. Referensi di atas dicatat sebagai bahan tur saja — rasa yang
dipertahankan adalah rasa ASLI produk, bukan rasa Mentorix.

## 2. Palet (6 warna bernama — token asli aplikasi, tidak diubah)

| Nama | Hex | Peran |
|---|---|---|
| Kertas | `#FFFEF7` | latar utama semua seksi terang |
| Tinta | `#1A1A2E` | teks, border 4px, footer |
| Kuning Rambu | `#FFE135` | latar hero (garis), CTA siswa, sorot |
| Koral Alarm | `#FF6B6B` | bahaya / bencana, aksen peringatan |
| Mint Aman | `#4ECDC4` | titik aman, sukses |
| Langit | `#74C0FC` | info, aksen sekunder |

Larangan: tanpa gradient ungu/biru; tanpa headline gradient. Pola
garis kuning-putih di hero (`repeating-linear-gradient` 45°) adalah
motif ASLI penulis (garis rambu, bukan sapuan warna) dan dipertahankan
apa adanya — pengecualian ini dicatat eksplisit di
`scripts/check-static.mjs`.

## 3. Tipografi (≤ 2 keluarga — sama seperti aplikasi)

- **Nunito 400/700/800/900** — display + body. Bulat, ramah anak.
- **JetBrains Mono 400/500** — label, angka, cap waktu (tabular-nums).

Bukan Inter/Roboto/system font untuk semuanya. Body ≤ 75ch.

## 4. Layout (produk asli) + detail khas

**Layout (apa adanya dari penulis):** hero tengah (badge → judul
"SafeKids" → subjudul EN → tagline → 3 kartu quick-start → tombol
panduan → 2 CTA Guru/Siswa → scroll cue) → seksi Peta Konsep
(ConceptMap) → seksi Alur 6 langkah (±90 menit) → footer hitam.

**Detail khas: stempel + garis rambu.** Kotak hitam berisi angka
kuning di tiap kartu, bayangan keras 4px, garis kuning-putih diagonal
di hero — ketiganya sudah ada di produk asli dan dipertahankan.

## 5. Beda dari repo sebelumnya (#48 dotfiles) — 5 dari 5 sumbu

| Sumbu | #48 dotfiles | #51 safekids |
|---|---|---|
| Palet | Meja `#F4F5F1` + Tinta + Teal Caelestia + Kuning Tombol | Kertas + Kuning Rambu + Koral Alarm + Mint Aman + Langit |
| Tipografi | Space Grotesk + IBM Plex Mono | Nunito + JetBrains Mono |
| Layout | 1 kolom editorial + mockup penuh lebar | Hero tengah + peta konsep + alur 6 langkah (asli produk) |
| Radius/spacing | radius 4px, meja kerja rapi | radius 0px (keras), bayangan keras 4px, stempel kotak |
| Detail khas | keycap + mockup desktop | garis rambu diagonal + stempel nomor + kartu quick-start |

## 6. Larangan P0 yang ditegakkan di UI produk ini

- Emoji mentah sebagai ikon fungsi → **sudah diperbaiki**: semua
  emoji di `WelcomePage.tsx` diganti ikon Lucide SVG (satu bobot,
  stroke 2px). Nol emoji di beranda.
- Statistik vanity → tidak ada; angka yang dipakai hanya angka nyata
  produk: 3 level bencana, 6 langkah, ±90 menit (semuanya bisa dicek
  di `src/store/useSimulationStore.ts`).
- Copy generik ("Elevate…", "Unlock…") → tidak ada; copy dipertahankan
  dari penulis ("Learn. Simulate. Stay Safe.").
- Footer 4 kolom default → footer hitam 1 kolom tengah (asli) +
  tautan GitHub (higiene repo, bukan fitur baru).

## 7. Motion & a11y (produk asli, dipertahankan)

- Transisi ≤ 100–200ms; tombol aktif geser bayangan (brutalism).
- `prefers-reduced-motion` dihormati (lihat `src/index.css`).
- Focus-visible: outline 3px Langit. Semua tombol ikon punya
  `aria-label`/`aria-hidden` yang benar. Tag semantik:
  `section/footer`, `h1` tunggal di hero.
- Mobile 390px: kartu quick-start + langkah menumpuk vertikal,
  target sentuh ≥ 44px, tanpa scroll horizontal.
