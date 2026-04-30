import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_MENU_URL, CUSTOMER_CART_URL } from '../../helpers/test-data';

test.describe('Customer Cart', () => {
  // Helper: add an item from the menu first
  async function addItemToCart(page: import('@playwright/test').Page) {
    await page.goto(CUSTOMER_MENU_URL);
    const addBtn = page.locator('button:has-text("Add"), button[aria-label*="add" i]').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await addBtn.click();
    await page.waitForTimeout(500);
  }

  test('cart page shows added items with quantities', async ({ customerPage: page }) => {
    await addItemToCart(page);
    await page.goto(CUSTOMER_CART_URL);
    await expect(page.locator('text=/₹|\$/').first()).toBeVisible({ timeout: 10_000 });
    // Quantity controls
    await expect(page.locator('button:has-text("+"), button:has-text("-")').first()).toBeVisible();
  });

  test('quantity +/- buttons update totals', async ({ customerPage: page }) => {
    await addItemToCart(page);
    await page.goto(CUSTOMER_CART_URL);
    const plusBtn = page.locator('button:has-text("+")').first();
    await plusBtn.waitFor({ state: 'visible', timeout: 10_000 });

    // Get subtotal before
    const subtotalBefore = await page.locator('text=/Subtotal|Total/i').first().textContent();
    await plusBtn.click();
    await page.waitForTimeout(500);
    const subtotalAfter = await page.locator('text=/Subtotal|Total/i').first().textContent();
    expect(subtotalBefore).not.toEqual(subtotalAfter);
  });

  test('Place Order button is present', async ({ customerPage: page }) => {
    await addItemToCart(page);
    await page.goto(CUSTOMER_CART_URL);
    await expect(page.locator('button:has-text("Place Order"), button:has-text("Order")').first()).toBeVisible({ timeout: 10_000 });
  });
});
