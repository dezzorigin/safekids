// Gate P0 anti-slop + kelengkapan tag OG/Twitter untuk beranda ASLI SafeKids.
// Dijalankan CI (job static-checks) — gagal = PR tidak merge.
// Aturan dari ~/workspace/github-actions/ui-anti-slop.md §2-3.
// Kontrak desain: docs/DESIGN.md (bahasa desain ASLI produk: Kertas,
// Tinta, Kuning Rambu, Koral Alarm, Mint Aman, Langit; Nunito +
// JetBrains Mono; radius 0; garis rambu + stempel nomor).
//
// PENGECUALIAN TERCATAT: pola garis kuning-putih di hero
// (`repeating-linear-gradient` 45°) adalah motif ASLI penulis (garis
// rambu, bukan sapuan warna) dan diizinkan eksplisit di bawah —
// gradient lain tetap terlarang.
import { readFileSync, existsSync, statSync } from 'node:fs'

const landing = readFileSync('src/pages/WelcomePage.tsx', 'utf8')
const html = readFileSync('index.html', 'utf8')
const css = readFileSync('src/index.css', 'utf8')
const tailwind = readFileSync('tailwind.config.js', 'utf8')
const failures = []

function check(cond, msg) {
  if (!cond) failures.push(msg)
}

// ── P0: gradient — kecuali pola garis rambu asli ───────────────────────────
const flat = landing.replace(/\s+/g, '').toLowerCase()
const stripe =
  'repeating-linear-gradient(45deg,#ffe135,#ffe1354px,#fffef74px,#fffef720px)'
check(flat.includes(stripe), 'pola garis rambu hero asli hilang dari WelcomePage')
const withoutStripe = flat.replace(stripe, '')
check(!/linear-gradient|radial-gradient|conic-gradient/i.test(withoutStripe),
  'P0: gradient terlarang di beranda (di luar pola garis rambu asli)')
check(!/bg-clip-text|background-clip:\s*text/i.test(landing),
  'P0: teks headline gradient terlarang')
// ── P0: emoji mentah sebagai ikon fungsi ───────────────────────────────────
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
check(!emojiRe.test(landing), 'P0: emoji mentah sebagai ikon terlarang di beranda')
// ── P0: font Inter / Roboto sebagai font utama ─────────────────────────────
check(/Nunito/.test(css + html + tailwind) && /JetBrains Mono/.test(css + html + tailwind),
  'font harus Nunito (display/body) + JetBrains Mono (label/data)')
check(/sans:\s*\['Nunito'/.test(tailwind),
  'tailwind fontFamily.sans harus diawali Nunito, bukan Inter/system')
// ── P0: copy generik ───────────────────────────────────────────────────────
for (const phrase of ['Elevate your workflow', 'Unlock the power', 'Supercharge']) {
  check(!landing.toLowerCase().includes(phrase.toLowerCase()),
    `P0: copy generik terlarang: "${phrase}"`)
}
// ── P0: rounded-2xl shadow-lg di semua permukaan ───────────────────────────
check(!/rounded-2xl/.test(landing), 'P0: rounded-2xl terlarang (radius beranda = 0)')
// ── P0: statistik vanity tanpa sumber ──────────────────────────────────────
for (const phrase of ['99.9% uptime', '10x faster', '50k+ users', '10x lebih cepat']) {
  check(!landing.includes(phrase), `P0: statistik vanity tanpa sumber: "${phrase}"`)
}
// ── Struktur + copy ASLI produk harus utuh ─────────────────────────────────
for (const phrase of [
  'SafeKids',
  'Learn. Simulate. Stay Safe.',
  'Pilih Peran',
  'Ikuti Sesi',
  'Bermain & Belajar',
  'Download Panduan Lengkap',
  'Peta Konsep Pembelajaran',
  'Alur Pembelajaran Hari Ini',
  '6 langkah',
  '±90 menit',
  'SafeKids — Disaster Evacuation Learning Media',
]) {
  check(landing.includes(phrase), `copy/struktur asli hilang dari beranda: "${phrase}"`)
}
// ── White-label (PR #3): tanpa atribusi personal/institusi di beranda ─────
for (const phrase of ['Najwa Azzahra', '240209050', 'PGMI', 'UIN Ar-Raniry', 'Ar-Raniry']) {
  check(!landing.includes(phrase), `white-label: atribusi terlarang masih ada di beranda: "${phrase}"`)
}
// ── Larangan pola SaaS (hasil revert PR #1) ────────────────────────────────
for (const phrase of ['Peta Evakuasi — Level', 'Langkah optimal', 'Satu sesi, semua alat guru', 'Guru pegang kendali', 'ticker-track', 'Belajar selamat']) {
  check(!landing.includes(phrase), `sisa pola landing SaaS harus dihapus: "${phrase}"`)
}
// ── GitHub (footer, higiene repo) ──────────────────────────────────────────
check(landing.includes('https://github.com/dezzorigin/safekids'),
  'tautan GitHub repo harus ada di beranda (footer)')
// ── Tag OG/Twitter di index.html (Vite SPA: tag harus di source) ──────────
for (const tag of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
  check(html.includes(tag), `tag ${tag} hilang dari index.html`)
}
check(html.includes('summary_large_image'), 'twitter:card harus summary_large_image')
check(html.includes('https://safekids-app.pages.dev/og-image.png'),
  'og:image harus URL absolut ke og-image.png')
// ── og-image.png: ada, 1200×630, ≥ 10 KB ───────────────────────────────────
const ogPath = 'public/og-image.png'
check(existsSync(ogPath), 'public/og-image.png hilang')
if (existsSync(ogPath)) {
  const buf = readFileSync(ogPath)
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  check(w === 1200 && h === 630, `og-image.png harus 1200×630, dapat ${w}×${h}`)
  check(statSync(ogPath).size >= 10 * 1024,
    `og-image.png harus ≥ 10 KB, dapat ${statSync(ogPath).size} byte`)
}
// ── SPA fallback + favicon ─────────────────────────────────────────────────
check(existsSync('public/_redirects'), 'public/_redirects hilang (SPA fallback Pages)')
check(existsSync('public/compass.svg'), 'public/compass.svg hilang (favicon)')

if (failures.length > 0) {
  console.error('check-static: FAIL')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('check-static: OK (gate P0 + OG + aset lolos)')
