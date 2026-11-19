# DESIGN.md — SafeKids (kontrak arah desain, repo P1 #51)

Ditulis SEBELUM coding (standar anti-slop P1, 19 Nov 2026).
Referensi pemenang, palet, tipografi, layout, dan detail khas dikunci di sini;
landing dibangun mengikuti kontrak ini, bukan selera sesaat.

## 1. Referensi

**Pemenang: Mentorix — Neobrutalism Online Education Platform Landing Page**
(Dribbble, Relyn LLC) —
https://dribbble.com/shots/27538236-Mentorix-Neobrutalism-Online-Education-Platform-Landing-Page

Kenapa cocok: platform edukasi gaya neo-brutalist — tipografi hitam tebal,
blok warna bergantian tiap seksi, kartu ber-border tebal + bayangan keras,
strip ticker, label pil di judul seksi. Rasa itu dipertahankan, isinya
diganti kurikulum evakuasi bencana untuk siswa SD.

Yang diadopsi plek-ketiplek strukturnya:
- hero energi tinggi, tipografi hitam besar di atas kertas terang;
- seksi-seksi blok warna bergantian (kertas → kuning → hitam → kertas);
- strip ticker hitam berjalan di antara hero dan fitur;
- label pil kecil di atas judul seksi ("Fitur", "Alur", "Peta Konsep");
- kartu border 4px + bayangan keras 4px, hover geser 2px.

Yang diubah + kenapa:
- palet Mentorix (cyan/lime elektrik) diganti token kelas SafeKids yang
  sudah dipakai di dalam aplikasi (kuning rambu, koral alarm, mint aman,
  langit) — supaya landing dan aplikasi terasa satu produk, bukan dua;
- hero tengah diganti hero 2 kolom: copy kiri, panel "Peta Evakuasi"
  kanan (mini peta rute + titik aman) — produknya simulasi 3D, jadi
  preview produk harus kelihatan di atas lipatan, bukan sekadar headline;
- katalog kursus diganti 6 langkah pembelajaran ±90 menit (isi nyata
  dari WelcomePage lama + PRD), tanpa statistik vanity.

Kandidat yang kalah:
- Rocket "Syllabus" (brutalist education builder) — terlalu korporat,
  bento grid generik, tidak ada rasa anak-anak.
- Rocket "Sprout" (preschool, teal catalyst) — hangat tapi palet
  teal/koral terlalu dekat dengan repo #48 (dotfiles: Teal Caelestia)
  dan nadanya daycare, bukan simulasi bencana.

## 2. Palet (6 warna bernama, tiap warna punya tugas)

| Nama | Hex | Peran |
|---|---|---|
| Kertas | `#FFFEF7` | latar utama semua seksi terang |
| Tinta | `#1A1A2E` | teks, border 4px, footer, strip ticker |
| Kuning Rambu | `#FFE135` | CTA utama, sorot, seksi alur |
| Koral Alarm | `#FF6B6B` | bahaya / bencana, aksen peringatan |
| Mint Aman | `#4ECDC4` | titik aman, sukses, kartu simulator |
| Langit | `#74C0FC` | info, kartu video, aksen sekunder |

Larangan: tanpa gradient ungu/biru di hero/background; tanpa headline
gradient; tanpa satu-hue saja (palet ini memotong 4 hue: kuning, merah,
hijau-mint, biru-langit).

## 3. Tipografi (≤ 2 keluarga)

- **Nunito 400/700/800/900** — display + body. Bulat, ramah anak,
  sudah dipakai aplikasi; headline 900 dengan tracking ketat.
- **JetBrains Mono 400/500** — label, angka, cap waktu, dan data
  (tabular-nums untuk angka: timer 75 detik, 6 langkah, ±90 menit).

Bukan Inter/Roboto/system font untuk semuanya. Body ≤ 75ch.

## 4. Layout (satu kalimat) + detail khas

**Layout:** sticky navbar hitam-tipis → hero 2 kolom (copy kiri, panel
peta evakuasi kanan) → strip ticker hitam → fitur asimetris (1 kartu
besar simulator + 3 kartu kecil + 1 kartu lebar dashboard guru) →
alur 6 langkah bernomor → peta konsep → strip "Untuk Guru" →
footer hitam 2 kolom.

**Detail khas: "jalur evakuasi".** Garis putus-putus (dashed) yang
menghubungkan titik start ke titik aman — dipakai di panel hero
(mini peta SVG 10×10 grid, rute gempa), di pemisah antar kartu fitur,
dan sebagai motif nomor langkah (stempel kotak hitam berisi angka
kuning, bukan lingkaran lembut).

## 5. Beda dari repo sebelumnya (#48 dotfiles) — 5 dari 5 sumbu

| Sumbu | #48 dotfiles | #51 safekids |
|---|---|---|
| Palet | Meja `#F4F5F1` + Tinta + Teal Caelestia + Kuning Tombol | Kertas + Kuning Rambu + Koral Alarm + Mint Aman + Langit |
| Tipografi | Space Grotesk + IBM Plex Mono | Nunito + JetBrains Mono |
| Layout | 1 kolom editorial + mockup penuh lebar | Hero 2 kolom + blok warna bergantian + fitur asimetris |
| Radius/spacing | radius 4px, meja kerja rapi | radius 0px (keras), bayangan keras 4px, stempel kotak |
| Detail khas | keycap + mockup desktop | jalur evakuasi dashed + stempel nomor + mini peta grid |

## 6. Larangan P0 yang ditegakkan di landing ini

- Emoji mentah sebagai ikon fungsi → diganti ikon Lucide SVG
  (satu bobot, stroke 2px). Emoji hanya tersisa di… tidak ada.
  Nol emoji di landing baru.
- Hero tengah + 3 kartu identik → hero 2 kolom, fitur asimetris.
- Statistik vanity → angka yang dipakai hanya angka nyata produk:
  3 level bencana, 6 langkah, ±90 menit, grid 10×10, timer tsunami
  75 detik, 1 sesi kelas. Semuanya bisa dicek di kode
  (`src/store/useSimulationStore.ts`).
- Copy generik ("Elevate…", "Unlock…") → copy konkret berbahasa
  Indonesia: "Belajar selamat dari bencana, sambil main."
- Footer 4 kolom default → footer hitam 2 kolom.
- `rounded-2xl shadow-lg` di semua permukaan → radius 0, bayangan
  keras 4px `#1A1A2E`, hover geser.

## 7. Motion & a11y

- Transisi ≤ 100–200ms, ease-out; tombol aktif scale/translate 2px
  (bukan 0.97 — brutalism memakai geser bayangan, bukan mengecil).
- `prefers-reduced-motion`: ticker dan animasi dekoratif dimatikan.
- Focus-visible: outline 3px Langit. Semua tombol ikon punya
  `aria-label`. Tag semantik: `header/nav/main/section/footer`, `h1`
  tunggal di hero.
- Mobile 390px: hero menumpuk vertikal, panel peta di bawah copy,
  kartu fitur 1 kolom, target sentuh ≥ 44px, tanpa scroll horizontal.
