import { test, expect } from '@playwright/test'

test.describe('Application smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('homepage loads without errors', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('বেজখণ্ড')
    await expect(page.locator('text=বিনামূল্যে ট্রায়াল শুরু করুন')).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('লগইন')
  })

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('h1')).toContainText('স্কুল রেজিস্ট্রেশন')
  })

  test('no console errors on public pages', async ({ page }) => {
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
