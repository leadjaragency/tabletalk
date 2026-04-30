import type { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

export async function loginAsSuperAdmin(page: Page) {
  await loginAs(page, 'admin@servemytable.com', 'servemytable2024');
  await page.waitForURL('**/super-admin**', { timeout: 15_000 });
}

export async function loginAsRestaurantOwner(page: Page) {
  await loginAs(page, 'owner@saffronpalace.com', 'saffron2024');
  await page.waitForURL('**/admin**', { timeout: 15_000 });
}
