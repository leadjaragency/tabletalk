import { test, expect } from '../../fixtures/auth';

test.describe('Admin AI Waiters', () => {
  test('seeded waiter cards render (Arjun, Priya, Vikram)', async ({ adminPage: page }) => {
    await page.goto('/admin/waiters');
    await expect(page.locator('text=Arjun').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Priya').first()).toBeVisible();
    await expect(page.locator('text=Vikram').first()).toBeVisible();
  });

  test('Add Waiter button opens modal', async ({ adminPage: page }) => {
    await page.goto('/admin/waiters');
    await page.click('button:has-text("Add Waiter")');
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 });
  });

  test('edit waiter opens pre-filled form', async ({ adminPage: page }) => {
    await page.goto('/admin/waiters');
    const editBtn = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    await editBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await editBtn.click();
    await expect(page.locator('input').first()).toBeVisible({ timeout: 8_000 });
    const val = await page.locator('input').first().inputValue();
    expect(val.length).toBeGreaterThan(0);
  });
});
