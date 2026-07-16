const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message, err.name);
  });
  
  console.log('=== Test signup on live site ===');
  await page.goto('https://students-tracker-gps.vercel.app/signup');
  await page.waitForTimeout(3000);
  
  // Fill form
  await page.fill('input[placeholder="বেজখণ্ড সঃ প্রাঃ বিদ্যালয়"]', 'Test School');
  await page.fill('input[placeholder="মোঃ কামরুল হাসান"]', 'Test Admin');
  await page.fill('input[placeholder="admin@school.edu.bd"]', 'test@example.com');
  await page.fill('input[placeholder="কমপক্ষে ৬ অক্ষর"]', 'password123');
  
  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  console.log('URL after submit:', page.url());
  console.log('Body text:', (await page.evaluate(() => document.body.innerText)).substring(0, 300));
  
  await browser.close();
})();
