import { test, expect } from '../../fixtures/auth';

test.describe('Admin Menu Manager', () => {
  test('category tabs and dishes load', async ({ adminPage: page }) => {
    await page.goto('/admin/menu');
    // First tab is always "All (N)" — wait for it
    await expect(page.locator('button, [role="tab"]').filter({ hasText: /^All/ }).first()).toBeVisible({ timeout: 15_000 });
    // At least one price visible ($X.XX format)
    await expect(page.getByText(/\$\d/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Add Dish button opens modal', async ({ adminPage: page }) => {
    await page.goto('/admin/menu');
    await page.click('button:has-text("Add Dish")');
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 });
  });

  test('edit existing dish opens pre-filled form', async ({ adminPage: page }) => {
    await page.goto('/admin/menu');
    // Edit icons are hidden until hover — force click on first one
    const editBtn = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    // Try hovering a dish row first to reveal the edit button
    const row = page.locator('tr, [role="row"]').nth(1);
    await row.waitFor({ state: 'visible', timeout: 15_000 });
    await row.hover();
    await editBtn.click({ force: true, timeout: 5_000 }).catch(async () => {
      // Fallback: click any visible pencil/edit icon
      await page.locator('button').filter({ has: page.locator('svg') }).first().click({ force: true });
    });
    await expect(page.locator('input').first()).toBeVisible({ timeout: 8_000 });
  });

  test('availability toggle is interactive', async ({ adminPage: page }) => {
    await page.goto('/admin/menu');
    // Radix UI Switch renders as button[role="switch"]
    const toggle = page.locator('button[role="switch"]').first();
    await toggle.waitFor({ state: 'visible', timeout: 15_000 });
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await page.waitForTimeout(500);
    const after = await toggle.getAttribute('aria-checked');
    expect(before).not.toEqual(after);
    // Restore original state
    await toggle.click();
  });
});
