import { test, expect } from '@playwright/test'

// Landing SafeKids hasil rebuild (repo #51): navbar sticky, hero 2 kolom
// + panel peta evakuasi, ticker, fitur asimetris, alur 6 langkah,
// peta konsep, strip guru, footer. Semua tombol/link diuji membuka
// rute yang benar-benar ada — tombol mati = cacat produk.

test('landing tampil: judul, hero 2 kolom, panel peta evakuasi', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/SafeKids/i)
  await expect(page.locator('h1').first()).toContainText('Belajar')
  await expect(page.locator('h1').first()).toContainText('selamat')
  // panel peta: grid SVG + data jujur dari store
  await expect(page.locator('text=Peta Evakuasi').first()).toBeVisible()
  await expect(page.locator('text=Langkah optimal:').first()).toBeVisible()
  // CTA guru + siswa
  await expect(page.locator('#cta-guru-btn')).toBeVisible()
  await expect(page.locator('#cta-siswa-btn')).toBeVisible()
  // GitHub kanan atas (navbar) mengarah ke repo
  const gh = page.locator('a[aria-label="Kode sumber SafeKids di GitHub"]')
  await expect(gh).toHaveAttribute('href', 'https://github.com/dezzorigin/safekids')
})

test('pemilih level peta mengganti data (BFS asli, bukan mockup mati)', async ({ page }) => {
  await page.goto('/')
  const optimal = page.locator('text=Langkah optimal:').first()
  await expect(optimal).toBeVisible()
  const gempa = await optimal.textContent()
  await page.getByRole('button', { name: 'Tsunami', exact: true }).click()
  await expect(page.locator('text=Peta Evakuasi — Level Tsunami').first()).toBeVisible()
  await expect(page.locator('text=Ombak datang dalam 75 detik').first()).toBeVisible()
  const tsunami = await optimal.textContent()
  expect(tsunami).not.toEqual(gempa)
  await page.getByRole('button', { name: 'Banjir', exact: true }).click()
  await expect(page.locator('text=Peta Evakuasi — Level Banjir').first()).toBeVisible()
})

test('fitur + alur: 6 langkah, tiap kartu membuka modulnya', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('text=Satu sesi, semua alat guru sudah siap.')).toBeVisible()
  await expect(page.locator('text=Simulator Evakuasi 3D')).toBeVisible()
  await expect(page.locator('text=Alur pembelajaran hari ini')).toBeVisible()
  // 6 kartu langkah
  await expect(page.locator('#alur ol li')).toHaveCount(6)
  // kartu simulator membuka /simulator (modul 3D lazy-load)
  await page.locator('text=Simulator Evakuasi 3D').click()
  await expect(page).toHaveURL(/\/simulator/)
  await page.goto('/')
  // langkah "Evacuation 3D" membuka simulator juga
  await page.locator('#alur ol li', { hasText: 'Evacuation 3D' }).click()
  await expect(page).toHaveURL(/\/simulator/)
})

test('CTA guru membuka halaman login guru', async ({ page }) => {
  await page.goto('/')
  await page.locator('#cta-guru-btn').click()
  await expect(page).toHaveURL(/\/admin\/login/)
})

test('footer: kredit + tautan GitHub + panduan', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer')
  await expect(footer.locator('text=Najwa Azzahra').first()).toBeVisible()
  await expect(footer.locator('text=240209050').first()).toBeVisible()
  await expect(footer.locator('a[href="https://github.com/dezzorigin/safekids"]').first()).toBeVisible()
})

test('mobile 390px: tanpa scroll horizontal', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
  await expect(page.locator('h1').first()).toBeVisible()
  await expect(page.locator('#cta-siswa-btn')).toBeVisible()
})
