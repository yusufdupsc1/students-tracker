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

  test('class roster page loads', async ({ page }) => {
    await page.goto('/roster')
    await expect(page.locator('h1')).toContainText('শ্রেণি তালিকা')
  })

  test('report card page loads', async ({ page }) => {
    await page.goto('/report-card')
    await expect(page.locator('h1')).toContainText('ফলাফল কার্ড')
  })

  test('progress tracking page loads', async ({ page }) => {
    await page.goto('/mtr')
    await expect(page.locator('h1')).toContainText('Progress ট্র্যাকিং')
  })

  test('search page loads', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('text=শিক্ষার্থী অনুসন্ধান')).toBeVisible()
  })

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('h1')).toContainText('সেটিংস')
  })

  test('no console errors on any page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const pages = ['/', '/roster', '/report-card', '/mtr', '/search', '/settings']
    for (const route of pages) {
      await page.goto(route)
      await page.waitForTimeout(500)
    }

    expect(errors).toHaveLength(0)
  })
})
