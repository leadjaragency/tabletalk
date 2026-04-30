import { test, expect } from '../../fixtures/auth';

test.describe('Admin Promotions', () => {
  test('promotion cards render', async ({ adminPage: page }) => {
    await page.goto('/admin/promotions');
    // Seeded promotions should appear
    await expect(page.locator('text=/Promotion|Offer|Discount/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Add Promotion modal opens and form validates', async ({ adminPage: page }) => {
    await page.goto('/admin/promotions');
    await page.click('button:has-text("Add"), button:has-text("New Promotion"), button:has-text("Create")');
    const titleField = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await expect(titleField).toBeVisible({ timeout: 10_000 });

    // Submit empty form → validation error
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/required|enter a/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
