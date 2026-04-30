import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_ABOUT_URL, DEMO_RESTAURANT_NAME } from '../../helpers/test-data';

test.describe('Customer About Page', () => {
  test('restaurant name, hours, and address render', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_ABOUT_URL);
    await expect(page.locator(`text=${DEMO_RESTAURANT_NAME}`).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Hours|Open|Close/i').first()).toBeVisible();
    await expect(page.locator('text=/Address|Location|Calgary/i').first()).toBeVisible();
  });

  test('page renders correctly at mobile viewport (393px)', async ({ customerPage: page }) => {
    // customerPage fixture already sets 393x851
    await page.goto(CUSTOMER_ABOUT_URL);
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(430);
    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
