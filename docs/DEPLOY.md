# DEPLOY.md — SafeKids

## 1. Target

- **URL produksi:** https://safekids-app.pages.dev/
- **Proyek Cloudflare Pages:** `safekids`
- **Sumber:** hasil build Vite (`dist/`), deploy direct-upload via
  `~/workspace/github-actions/cf_pages.py` (token dari vault — jangan
  minta kredensial, jangan tempel token di chat).
- **SPA fallback:** `public/_redirects` (`/* /index.html 200`) supaya
  deep link (`/simulator`, `/video`, …) tidak 404.

## 2. Cara deploy

```bash
# 1. Build (lokal, pola VM — lihat docs/TESTING.md §3)
npm ci --no-bin-links --ignore-scripts
node node_modules/vite/bin/vite.js build

# 2. Deploy hasil build ke Pages
python3 ~/workspace/github-actions/cf_pages.py deploy safekids dist

# 3. Bila nama `safekids` dipakai akun lain (sufiks di hasil create),
#    pindah ke fallback: safekids-app, lalu safekids-id.
```

## 3. Verifikasi live (SEBELUM merge PR)

Pakai python urllib dengan **UA browser** (UA default python kena 403
dari Cloudflare):

```bash
python3 - <<'EOF'
import urllib.request
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'}
for url in ['https://safekids-app.pages.dev/',
            'https://safekids-app.pages.dev/og-image.png',
            'https://safekids-app.pages.dev/compass.svg']:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.build_opener().open(req, timeout=30) as r:
        print(url, r.status, r.headers.get('Content-Type'))
EOF
```

Checklist:

- [ ] root 200 + `<title>` SafeKids + marker landing di `index.html`
- [ ] semua tag `og:*` / `twitter:*` ada di `index.html` hasil build
      (Vite SPA: tag ada di `index.html` source, bukan hasil render JS)
- [ ] `og-image.png` 200 dengan `Content-Type: image/*` (bukan
      `text/html` — Pages fallback menipu: file hilang pun bisa
      mengembalikan `index.html` 200)
- [ ] marker landing ada di bundle JS hasil build (`dist/assets/index-*.js`
      mengandung "Belajar", "Peta Evakuasi", "Langkah optimal") —
      `index.html` Vite hanya shell
- [ ] deep link `/simulator` 200 (SPA fallback `_redirects` jalan)

## 4. Catatan

- Deploy ulang tiap merge ke `main` (manual via `cf_pages.py` untuk
  saat ini — belum ada deploy otomatis dari CI).
- `vercel.json` di repo adalah peninggalan deploy lama (Vercel);
  deploy aktif adalah Cloudflare Pages. File itu dibiarkan apa adanya
  supaya tidak merusak riwayat, tapi tidak dipakai.
