import { test, expect } from '../../fixtures/auth';

test.describe('Admin Team Management', () => {
  test('team member list loads with owner visible', async ({ adminPage: page }) => {
    await page.goto('/admin/team');
    // The owner themselves should appear in the list
    await expect(page.locator('text=/owner@saffronpalace|Owner/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Invite Member modal opens', async ({ adminPage: page }) => {
    await page.goto('/admin/team');
    await page.click('button:has-text("Invite"), button:has-text("Add Member"), button:has-text("New Member")');
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
