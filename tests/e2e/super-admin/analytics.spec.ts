import { test, expect } from '../../fixtures/auth';

test.describe('Super Admin Platform Analytics', () => {
  test('analytics page loads without JS errors', async ({ superAdminPage: page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/super-admin/analytics');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('aggregate stats render (orders, restaurants by cuisine)', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/analytics');
    await expect(page.locator('text=/Total|Orders|Restaurant/i').first()).toBeVisible({ timeout: 15_000 });
  });
});
