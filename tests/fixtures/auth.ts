/**
 * Playwright fixtures that provide pre-authenticated browser pages.
 * Import { test, expect } from this file instead of '@playwright/test' in any spec
 * that needs a logged-in context.
 */

import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const SUPER_ADMIN_AUTH = path.join(__dirname, '../.auth/super-admin.json');
const RESTAURANT_ADMIN_AUTH = path.join(__dirname, '../.auth/restaurant-admin.json');

type AuthFixtures = {
  superAdminPage: Page;
  adminPage: Page;
  customerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Loaded with super admin session cookies
  superAdminPage: async ({ browser }, use) => {
    const ctx: BrowserContext = await browser.newContext({
      storageState: SUPER_ADMIN_AUTH,
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  // Loaded with restaurant owner session cookies
  adminPage: async ({ browser }, use) => {
    const ctx: BrowserContext = await browser.newContext({
      storageState: RESTAURANT_ADMIN_AUTH,
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  // No auth — plain mobile-sized context for customer app
  customerPage: async ({ browser }, use) => {
    const ctx: BrowserContext = await browser.newContext({
      viewport: { width: 393, height: 851 },
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect };
