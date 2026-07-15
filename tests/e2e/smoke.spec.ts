import { test, expect } from '@playwright/test'

test.describe('Application smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('homepage loads without errors', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('বেজখণ্ড')
    await expect(page.locator('text=ড্যাশবোর্ড')).toBeVisible()
  })

  test('sidebar navigation is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    await expect(page.locator('text=তালিকা')).toBeVisible()
    await expect(page.locator('text=ফলাফল')).toBeVisible()
    await expect(page.locator('text=Progress ট্র্যাকিং')).toBeVisible()
    await expect(page.locator('text=ইমপোর্ট ও ব্যাকআপ')).toBeVisible()
    await expect(page.locator('text=সেটিংস')).toBeVisible()
  })

  test('mobile bottom navigation is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('text=ড্যাশবোর্ড')).toBeVisible()
    await expect(page.locator('text=তালিকা')).toBeVisible()
  })

  test('dashboard loads with seeded data', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=ক্লাস অনুযায়ী সারসংক্ষেপ')).toBeVisible()
  })

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    const protectedRoutes = ['/roster', '/report-card', '/mtr', '/search', '/settings']
    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForURL('**/login')
      expect(page.url()).toContain('/login')
    }
  })

  test('no console errors on any page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const pages = ['/', '/login', '/signup']
    for (const route of pages) {
      await page.goto(route)
      await page.waitForTimeout(500)
    }

    expect(errors).toHaveLength(0)
  })
})
