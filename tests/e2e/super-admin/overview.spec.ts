import { test, expect } from '../../fixtures/auth';

test.describe('Super Admin Overview', () => {
  test('loads with 4 stat cards', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin');
    await expect(page.locator('text=Active Restaurants').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Orders Today').first()).toBeVisible();
    await expect(page.locator('text=Monthly Revenue').first()).toBeVisible();
    await expect(page.locator('text=API Cost Today').first()).toBeVisible();
  });

  test('recent activity feed is visible', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin');
    await expect(page.locator('text=/Activity|Recent|Latest/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('restaurant admin visiting /super-admin is redirected', async ({ adminPage: page }) => {
    await page.goto('/super-admin');
    await expect(page).not.toHaveURL(/\/super-admin/, { timeout: 10_000 });
  });
});
