import { test, expect } from '../../fixtures/auth';

test.describe('Admin POS Integration', () => {
  test('POS connection status card renders', async ({ adminPage: page }) => {
    await page.goto('/admin/pos');
    await expect(page.locator('text=/POS|Point of Sale|Connection/i').first()).toBeVisible({ timeout: 15_000 });
    // Status indicator (connected/disconnected)
    await expect(page.locator('text=/Connected|Disconnected|Status/i').first()).toBeVisible({ timeout: 10_000 });
  });
});
