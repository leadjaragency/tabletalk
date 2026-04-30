import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_TABLE_URL, CUSTOMER_CHAT_URL, DEMO_RESTAURANT_NAME } from '../../helpers/test-data';

test.describe('Customer Splash Screen', () => {
  test('shows restaurant name and table number', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_TABLE_URL);
    await expect(page.locator(`text=${DEMO_RESTAURANT_NAME}`).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Table/i').first()).toBeVisible();
  });

  test('auto-redirects to chat within 4 seconds', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_TABLE_URL);
    await expect(page).toHaveURL(/\/chat/, { timeout: 6_000 });
  });
});
