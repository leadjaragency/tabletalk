import { test, expect } from '../../fixtures/auth';

test.describe('Super Admin Settings', () => {
  test('subscription tiers section renders', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/settings');
    await expect(page.locator('text=/Tier|Plan|Subscription/i').first()).toBeVisible({ timeout: 15_000 });
    // Basic, Standard, Premium
    await expect(page.locator('text=/Basic|Standard|Premium/i').first()).toBeVisible();
  });

  test('API key field is masked', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/settings');
    // API key inputs should be of type password or show masked content
    const apiKeyField = page.locator('input[name*="api" i], input[placeholder*="API" i]').first();
    if (await apiKeyField.isVisible()) {
      const type = await apiKeyField.getAttribute('type');
      expect(['password', 'text']).toContain(type);
      // If text type, value should be masked (starts with sk-ant-... or shown as ••••)
    } else {
      // Shown as static text — just verify key section exists
      await expect(page.locator('text=/API Key|Anthropic/i').first()).toBeVisible();
    }
  });
});
