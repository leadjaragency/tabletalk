import { test, expect } from '../../fixtures/auth';

test.describe('Super Admin Billing', () => {
  test('billing table renders with restaurant, tier, and price columns', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/billing');
    await expect(page.locator('text=/Restaurant/i').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Tier|Plan/i').first()).toBeVisible();
    await expect(page.locator('text=/Price|Cost|Monthly/i').first()).toBeVisible();
  });

  test('edit tier control is interactive', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/billing');
    // A dropdown or button to change tier should exist
    const tierControl = page.locator('select, button:has-text("Edit Tier"), button:has-text("Change")').first();
    await expect(tierControl).toBeVisible({ timeout: 15_000 });
  });
});
