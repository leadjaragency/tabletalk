/**
 * Runs once before all test projects.
 * 1. Logs in as super admin and restaurant owner, saves auth state to disk.
 * 2. Auth state files are then reused by every test via the fixtures in tests/fixtures/auth.ts.
 *
 * The test DB must already be migrated and seeded before running tests.
 * Run from servemytable/:
 *   DATABASE_URL=<test-db-url> npx prisma migrate deploy
 *   DATABASE_URL=<test-db-url> tsx prisma/seed.ts
 */

import { test as setup } from '@playwright/test';
import path from 'path';

const SUPER_ADMIN_AUTH = path.join(__dirname, '.auth/super-admin.json');
const RESTAURANT_ADMIN_AUTH = path.join(__dirname, '.auth/restaurant-admin.json');

setup('authenticate as super admin', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'superadmin@servemytable.ca');
  await page.fill('input[type="password"]', 'Naman2019@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/super-admin**', { timeout: 15_000 });
  await page.context().storageState({ path: SUPER_ADMIN_AUTH });
});

setup('authenticate as restaurant admin', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'owner@saffronpalace.com');
  await page.fill('input[type="password"]', 'saffron2024');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 15_000 });
  await page.context().storageState({ path: RESTAURANT_ADMIN_AUTH });
});
