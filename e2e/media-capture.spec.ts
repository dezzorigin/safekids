import { test, expect } from '@playwright/test'

// Media capture untuk README: alur siswa (beranda -> pilih peran ->
// pilih kelompok -> sesi -> simulator 3D), desktop saja, dengan video
// recording Playwright + screenshot tiap adegan kunci.
// Supabase berjalan mode demo (tanpa kunci di CI): pilih kelompok tetap
// jalan lokal, README menyatakan itu jujur — JANGAN klaim login guru /
// sinkronisasi Supabase jalan di rekaman ini.
// Navigasi HARUS lewat klik (client-side routing): server statis CI tanpa
// SPA fallback, jadi goto() langsung ke /simulator akan 404.
test.use({ video: { mode: 'on', size: { width: 1280, height: 800 } } })

test('media capture: alur siswa beranda → kelompok → simulator 3D (desktop)', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'media capture desktop only')

  // Adegan 1: beranda asli (hero + 3 kartu quick-start + CTA guru/siswa).
  await page.goto('/')
  await expect(page.locator('h1').first()).toHaveText('SafeKids')
  await expect(page.locator('#cta-siswa-btn')).toBeVisible()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'media-capture/01-home.png' })

  // Adegan 2: masuk sebagai siswa -> halaman login (tirai) -> pilih kelompok.
  await page.locator('#cta-siswa-btn').click()
  await expect(page).toHaveURL(/\/student\/login/)
  // Klik layar untuk melewati tirai (otomatis lanjut setelah 4,5 detik juga).
  await page.mouse.click(640, 400)
  await expect(page).toHaveURL(/\/student\/group/, { timeout: 15000 })
  await expect(page.locator('text=Pilih Kelompokmu!').first()).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'media-capture/02-groups.png' })

  // Adegan 3: pilih Kelompok 1 -> sesi (Peta Konsep).
  await page.locator('.group-button').first().click()
  await expect(page).toHaveURL(/\/mission/, { timeout: 15000 })
  // h1 pertama di /mission adalah judul TopNav ("Mission Briefing"),
  // jadi asersi pakai heading halaman ("Peta Konsep & Tujuan Pembelajaran").
  await expect(page.getByRole('heading', { name: /Peta Konsep/ })).toBeVisible()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'media-capture/03-mission.png' })

  // Adegan 4: sidebar -> Evacuation 3D (pilih level Gempa/Banjir/Tsunami).
  await page.locator('a[href="/simulator"]').first().click()
  await expect(page).toHaveURL(/\/simulator/)
  await expect(page.locator('text=LEVEL 1').first()).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'media-capture/04-simulator.png' })

  // Adegan 5: mulai level Gempa -> grid 3D (Canvas). WebGL di CI
  // (SwiftShader) kadang lambat: best-effort, jangan gagalkan capture
  // bila canvas tak muncul — screenshot level-select sudah cukup.
  try {
    await page.locator('text=Mulai Gempa Bumi').first().click()
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(2500)
    await page.screenshot({ path: 'media-capture/05-simulator-3d.png' })
  } catch {
    console.log('media capture: canvas 3D tidak muncul di CI — lewati adegan 5')
  }
  await page.waitForTimeout(1000)
})
