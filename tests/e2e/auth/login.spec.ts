import { test, expect } from '@playwright/test';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, RESTAURANT_OWNER_EMAIL, RESTAURANT_OWNER_PASSWORD } from '../../helpers/test-data';

test.describe('Login', () => {
  test('super admin login redirects to /super-admin', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL);
    await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/super-admin/, { timeout: 15_000 });
  });

  test('restaurant owner login redirects to /admin', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', RESTAURANT_OWNER_EMAIL);
    await page.fill('input[type="password"]', RESTAURANT_OWNER_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
  });

  test('invalid credentials shows error message', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10_000 });
  });

  test('empty form submission shows validation errors', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button[type="submit"]');
    // Zod/RHF validation errors appear without a network round-trip
    await expect(page.locator('text=/valid email|required/i').first()).toBeVisible();
  });

  test('unauthenticated visit to /admin redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});
