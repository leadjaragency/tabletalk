import { test, expect } from '../../fixtures/auth';

test.describe('Admin Settings', () => {
  test('restaurant profile form is pre-filled with existing data', async ({ adminPage: page }) => {
    await page.goto('/admin/settings');
    // Wait for the page to load and form to populate
    await expect(page.locator('text=Restaurant Name').first()).toBeVisible({ timeout: 15_000 });
    // The first text input should have "Saffron Palace" pre-filled
    const firstInput = page.locator('input[type="text"], input:not([type])').first();
    await expect(firstInput).not.toHaveValue('', { timeout: 10_000 });
  });

  test('Save Changes button submits and shows success feedback', async ({ adminPage: page }) => {
    await page.goto('/admin/settings');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=/saved|updated|success/i').first()).toBeVisible({ timeout: 10_000 });
  });
});
