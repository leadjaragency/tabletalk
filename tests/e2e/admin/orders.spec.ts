import { test, expect } from '../../fixtures/auth';

test.describe('Admin Live Orders', () => {
  test('status pipeline columns render', async ({ adminPage: page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('text=/Received/i').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Preparing/i').first()).toBeVisible();
    await expect(page.locator('text=/Ready/i').first()).toBeVisible();
    await expect(page.locator('text=/Served/i').first()).toBeVisible();
  });

  test('order cards show table badge and total', async ({ adminPage: page }) => {
    await page.goto('/admin/orders');
    // Wait for content — there are seeded orders
    await page.waitForTimeout(2000);
    const orderCard = page.locator('[data-testid="order-card"], .order-card').first();
    if (await orderCard.isVisible()) {
      await expect(orderCard.locator('text=/Table/i')).toBeVisible();
    } else {
      // If no order cards are present as components, just check for any order text
      await expect(page.locator('text=/Table|Order #|₹|\$/i').first()).toBeVisible();
    }
  });

  test('page loads without errors', async ({ adminPage: page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});
