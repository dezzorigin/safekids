import { test, expect } from '@playwright/test'

// Beranda ASLI SafeKids (bukan landing SaaS): hero + peta konsep +
// alur 6 langkah + footer. Yang diuji: konten asli produk + tiap
// tombol/link membuka rute yang benar-benar ada — tombol mati = cacat.

test('beranda tampil: judul, hero asli, CTA guru/siswa', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/SafeKids/i)
  await expect(page.locator('h1').first()).toHaveText('SafeKids')
  await expect(page.locator('text=Interactive Disaster Evacuation Learning Media').first()).toBeVisible()
  await expect(page.locator('text=Learn. Simulate. Stay Safe.').first()).toBeVisible()
  await expect(page.locator('text=PGMI').first()).toBeVisible()
  // 3 kartu quick-start asli
  await expect(page.locator('text=Pilih Peran').first()).toBeVisible()
  await expect(page.locator('text=Ikuti Sesi').first()).toBeVisible()
  await expect(page.locator('text=Bermain & Belajar').first()).toBeVisible()
  // CTA guru + siswa
  await expect(page.locator('#cta-guru-btn')).toBeVisible()
  await expect(page.locator('#cta-siswa-btn')).toBeVisible()
  // tautan panduan guru (PDF penulis)
  await expect(page.locator('text=Download Panduan Lengkap').first()).toBeVisible()
})

test('peta konsep + alur: 6 langkah ±90 menit', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('text=Peta Konsep Pembelajaran').first()).toBeVisible()
  await expect(page.locator('text=Alur Pembelajaran Hari Ini').first()).toBeVisible()
  await expect(page.locator('text=6 langkah').first()).toBeVisible()
  await expect(page.locator('text=±90 menit').first()).toBeVisible()
  // 6 kartu langkah asli
  for (const label of ['Peta Konsep', 'Spin Wheel', 'Evacuation Video', 'Tutorial & Ice Break', 'Evacuation 3D', 'Quiz + Refleksi']) {
    await expect(page.locator(`text=${label}`).first()).toBeVisible()
  }
})

test('CTA guru membuka halaman login guru', async ({ page }) => {
  await page.goto('/')
  await page.locator('#cta-guru-btn').click()
  await expect(page).toHaveURL(/\/admin\/login/)
})

test('footer: kredit + tautan GitHub', async ({ page }) => {
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
