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
    command: 'npx vite preview --port 8511 --strictPort',
    url: 'http://127.0.0.1:8511/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
