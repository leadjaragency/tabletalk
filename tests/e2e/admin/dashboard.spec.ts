import { test, expect } from '../../fixtures/auth';

test.describe('Admin Dashboard', () => {
  test('loads with 4 stat cards', async ({ adminPage: page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Active Tables').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Orders Today').first()).toBeVisible();
    await expect(page.locator('text=Revenue Today').first()).toBeVisible();
    await expect(page.locator('text=Avg Wait Time').first()).toBeVisible();
  });

  test('live orders feed section is visible', async ({ adminPage: page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=/Live Orders|Active Orders|Recent Orders/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('AI Waiters status section renders', async ({ adminPage: page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=/AI Waiter|Waiter/i').first()).toBeVisible({ timeout: 15_000 });
  });
});
