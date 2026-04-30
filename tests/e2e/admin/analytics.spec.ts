import { test, expect } from '../../fixtures/auth';

test.describe('Admin Analytics', () => {
  test('revenue and satisfaction stats render', async ({ adminPage: page }) => {
    await page.goto('/admin/analytics');
    await expect(page.locator('text=/Revenue/i').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Satisfaction|Rating|Review/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Top Selling Dishes section is present', async ({ adminPage: page }) => {
    await page.goto('/admin/analytics');
    await expect(page.locator('text=/Top|Best Selling|Popular/i').first()).toBeVisible({ timeout: 15_000 });
  });
});
