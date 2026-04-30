import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_BILL_URL } from '../../helpers/test-data';

test.describe('Customer Bill', () => {
  test('bill page loads with itemized list and totals', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_BILL_URL);
    await expect(page.locator('text=/Subtotal|Total|Bill/i').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Tax/i').first()).toBeVisible();
  });

  test('tip buttons update the grand total', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_BILL_URL);
    const tipBtn = page.locator('button:has-text("15%"), button:has-text("10%"), button:has-text("20%")').first();
    await tipBtn.waitFor({ state: 'visible', timeout: 15_000 });

    const totalBefore = await page.locator('text=/Grand Total|Total/i').first().textContent();
    await tipBtn.click();
    await page.waitForTimeout(300);
    const totalAfter = await page.locator('text=/Grand Total|Total/i').first().textContent();
    expect(totalBefore).not.toEqual(totalAfter);
  });

  test('Pay / Request Bill button is present', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_BILL_URL);
    await expect(page.locator('button:has-text("Pay"), button:has-text("Request Bill"), button:has-text("Checkout")').first()).toBeVisible({ timeout: 15_000 });
  });
});
