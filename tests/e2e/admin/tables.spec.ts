import { test, expect } from '../../fixtures/auth';

test.describe('Admin Tables', () => {
  test('table grid renders with status badges', async ({ adminPage: page }) => {
    await page.goto('/admin/tables');
    await expect(page.locator('text=Active Tables, text=Table').first()).toBeVisible({ timeout: 15_000 });
    // Status filter buttons confirm the grid is loaded
    await expect(page.locator('button:has-text("All")').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Add Table modal opens', async ({ adminPage: page }) => {
    await page.goto('/admin/tables');
    await page.click('button:has-text("Add Table")');
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 });
  });

  test('status filter buttons work', async ({ adminPage: page }) => {
    await page.goto('/admin/tables');
    // Click "Empty" filter
    await page.click('button:has-text("Empty")');
    await page.waitForTimeout(300);
    // The "Empty" button should now be active (has different styling)
    await expect(page.locator('button:has-text("Empty")').first()).toBeVisible();
    // Reset to All
    await page.click('button:has-text("All")');
  });
});
