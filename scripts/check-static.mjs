// Gate P0 anti-slop + kelengkapan tag OG/Twitter untuk landing SafeKids.
// Dijalankan CI (job static-checks) — gagal = PR tidak merge.
// Aturan dari ~/workspace/github-actions/ui-anti-slop.md §2-3.
// Kontrak desain: docs/DESIGN.md (Kertas, Tinta, Kuning Rambu, Koral
// Alarm, Mint Aman, Langit; Nunito + JetBrains Mono; radius 0;
// detail khas jalur evakuasi dashed + stempel nomor).
import { readFileSync, existsSync, statSync } from 'node:fs'

const landing = readFileSync('src/pages/WelcomePage.tsx', 'utf8')
const html = readFileSync('index.html', 'utf8')
const css = readFileSync('src/index.css', 'utf8')
const tailwind = readFileSync('tailwind.config.js', 'utf8')
const failures = []

function check(cond, msg) {
  if (!cond) failures.push(msg)
}

// ── P0: gradient di hero/background landing ───────────────────────────────
check(!/linear-gradient|radial-gradient|conic-gradient/i.test(landing),
  'P0: gradient terlarang di landing (WelcomePage)')
check(!/bg-clip-text|background-clip:\s*text/i.test(landing),
  'P0: teks headline gradient terlarang')
// ── P0: hero tengah + 3 kartu identik ──────────────────────────────────────
// Landing ini hero 2 kolom (grid lg:grid-cols-2) — bukan tengah.
check(/lg:grid-cols-2/.test(landing), 'hero harus 2 kolom, bukan tengah')
// ── P0: emoji mentah sebagai ikon fungsi ───────────────────────────────────
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
check(!emojiRe.test(landing), 'P0: emoji mentah sebagai ikon terlarang di landing')
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
check(!/rounded-2xl/.test(landing), 'P0: rounded-2xl terlarang (radius landing = 0)')
// ── P0: statistik vanity tanpa sumber ──────────────────────────────────────
for (const phrase of ['99.9% uptime', '10x faster', '50k+ users', '10x lebih cepat']) {
  check(!landing.includes(phrase), `P0: statistik vanity tanpa sumber: "${phrase}"`)
}
// ── Angka yang dipakai harus angka nyata produk ────────────────────────────
for (const phrase of ['6 langkah', '±90 menit', '10×10', '75 detik']) {
  check(landing.includes(phrase), `angka nyata produk hilang dari landing: "${phrase}"`)
}
// ── GitHub kanan atas ──────────────────────────────────────────────────────
check(landing.includes('https://github.com/dezzorigin/safekids'),
  'tautan GitHub repo harus ada di landing (navbar)')
// ── Tag OG/Twitter di index.html (Vite SPA: tag harus di source) ──────────
for (const tag of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
  check(html.includes(tag), `tag ${tag} hilang dari index.html`)
}
check(html.includes('summary_large_image'), 'twitter:card harus summary_large_image')
check(html.includes('https://safekids.pages.dev/og-image.png'),
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
