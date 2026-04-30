import { test, expect } from '../../fixtures/auth';

test.describe('Super Admin API Usage', () => {
  test('API usage table renders per-restaurant stats', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/api-usage');
    await expect(page.locator('text=/API|Usage|Token/i').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Restaurant/i').first()).toBeVisible();
  });

  test('daily usage data or chart section is present', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/api-usage');
    await expect(page.locator('text=/Daily|Cost|Total|Chart/i').first()).toBeVisible({ timeout: 15_000 });
  });
});
