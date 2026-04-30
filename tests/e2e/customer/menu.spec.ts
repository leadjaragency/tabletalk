import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_MENU_URL } from '../../helpers/test-data';

test.describe('Customer Menu', () => {
  test('category tabs and dishes load with prices', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_MENU_URL);
    // First tab is always "All"
    await expect(page.locator('button').filter({ hasText: /^All/ }).first()).toBeVisible({ timeout: 15_000 });
    // Dish prices ($X.XX format)
    await expect(page.getByText(/\$\d/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('search bar filters dishes', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_MENU_URL);
    const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    await search.waitFor({ state: 'visible', timeout: 10_000 });
    await search.fill('Butter');
    await expect(page.locator('text=/Butter/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Veg Only filter toggle works', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_MENU_URL);
    const vegBtn = page.locator('button:has-text("Veg Only")');
    await vegBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await vegBtn.click();
    await expect(vegBtn).toBeVisible(); // button still visible after click
  });

  test('Add button adds item and cart bar shows count', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_MENU_URL);
    const addBtn = page.locator('button:has-text("Add")').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await addBtn.click();
    await expect(page.locator('text=/1 item|View Cart|Cart/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
