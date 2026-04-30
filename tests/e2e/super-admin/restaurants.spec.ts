import { test, expect } from '../../fixtures/auth';
import { DEMO_RESTAURANT_NAME } from '../../helpers/test-data';

test.describe('Super Admin Restaurants', () => {
  test('restaurant list renders with Saffron Palace', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/restaurants');
    await expect(page.locator(`text=${DEMO_RESTAURANT_NAME}`).first()).toBeVisible({ timeout: 15_000 });
  });

  test('search by name filters results', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/restaurants');
    const searchInput = page.locator('input[placeholder*="Search by name"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('Saffron');
    await expect(page.locator(`text=${DEMO_RESTAURANT_NAME}`).first()).toBeVisible();
    await searchInput.fill('zzznoresult');
    await expect(page.locator(`text=${DEMO_RESTAURANT_NAME}`).first()).not.toBeVisible();
  });

  test('status filter tab works', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/restaurants');
    await page.click('button:has-text("Active")');
    await expect(page.locator(`text=${DEMO_RESTAURANT_NAME}`).first()).toBeVisible({ timeout: 5_000 });
  });
});
