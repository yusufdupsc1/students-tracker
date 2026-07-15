import { test, expect } from '@playwright/test'

test.describe('Print parity', () => {
  test('report card print layout has no horizontal overflow', async ({ page }) => {
    await page.goto('/report-card')
    await page.waitForTimeout(1000)

    // Skip if redirected to login (unauthenticated)
    if (page.url().includes('/login')) {
      test.skip(true, 'Requires authentication')
      return
    }

    // Enable print simulation
    await page.emulateMedia({ media: 'print' })

    const overflow = await page.evaluate(() => {
      const docEl = document.documentElement
      const hasOverflow = docEl.scrollWidth > docEl.clientWidth
      const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => !img.complete || img.naturalWidth === 0)
      return {
        hasOverflow,
        brokenImages: brokenImages.length,
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth
      }
    })

    expect(overflow.hasOverflow).toBe(false)
    expect(overflow.brokenImages).toBe(0)
  })

  test('print hides navigation elements', async ({ page }) => {
    await page.goto('/report-card')
    await page.waitForTimeout(1000)

    // Skip if redirected to login (unauthenticated)
    if (page.url().includes('/login')) {
      test.skip(true, 'Requires authentication')
      return
    }

    await page.emulateMedia({ media: 'print' })

    const hidden = await page.evaluate(() => {
      const sidebar = document.querySelector('.app-sidebar')
      const topbar = document.querySelector('.app-topbar')
      const bottomnav = document.querySelector('.app-bottomnav')
      
      return {
        sidebarHidden: sidebar ? getComputedStyle(sidebar).display === 'none' : false,
        topbarHidden: topbar ? getComputedStyle(topbar).display === 'none' : false,
        bottomnavHidden: bottomnav ? getComputedStyle(bottomnav).display === 'none' : false
      }
    })

    expect(hidden.sidebarHidden).toBe(true)
    expect(hidden.topbarHidden).toBe(true)
    expect(hidden.bottomnavHidden).toBe(true)
  })

  test('report card content is visible in print mode', async ({ page }) => {
    await page.goto('/report-card')
    await page.waitForTimeout(1000)

    // Skip if redirected to login (unauthenticated)
    if (page.url().includes('/login')) {
      test.skip(true, 'Requires authentication')
      return
    }

    await page.emulateMedia({ media: 'print' })

    const hasContent = await page.evaluate(() => {
      const reportCard = document.querySelector('.report-card')
      if (!reportCard) return false
      const text = reportCard.innerText || ''
      return text.length > 50 && /ফলাফল/.test(text)
    })

    expect(hasContent).toBe(true)
  })
})
