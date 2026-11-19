import { defineConfig, devices } from '@playwright/test'

// E2E landing + alur utama SafeKids (Vite SPA, preview statis dari dist/).
// Mobile memakai Pixel 7 (Chromium) — BUKAN iPhone: WebKit tidak
// ter-install di CI, hanya Chromium (pelajaran #47).
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8511',
    trace: 'retain-on-failure',
  },
  webServer: {
    // POLA RANTAI (#46-#48, terbukti hijau): sajikan dist/ dengan
    // python http.server, BUKAN `npx vite preview`. Percobaan pertama
    // repo ini memakai vite preview dan CI gagal total di langkah ini:
    // "Timed out waiting 60000ms from config.webServer" (run
    // 44512978467) — preview tidak pernah menjawab di 127.0.0.1:8511.
    // Tes hanya navigasi via klik (client-side routing), jadi tanpa
    // SPA fallback pun cukup: server hanya perlu melayani / + aset.
    command: 'python3 -m http.server 8511 --directory dist --bind 127.0.0.1',
    url: 'http://127.0.0.1:8511/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
