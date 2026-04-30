import { test, expect } from '../../fixtures/auth';

test.describe('Super Admin Approvals', () => {
  test('approvals page loads (pending list or empty state)', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/approvals');
    // Either there are pending requests, or an empty state message
    await expect(
      page.locator('text=/Pending|Approval|No pending|Empty/i').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('approve button is present when pending restaurant exists', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/approvals');
    const approveBtn = page.locator('button:has-text("Approve")');
    // If there are pending restaurants, the button should exist
    const count = await approveBtn.count();
    if (count > 0) {
      await expect(approveBtn.first()).toBeEnabled();
    } else {
      // No pending signups — just verify the page loaded without error
      await expect(page.locator('text=/No pending|Empty|approved/i').first()).toBeVisible();
    }
  });
});
