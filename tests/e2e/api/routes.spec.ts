/**
 * API-level tests using Playwright's `request` fixture (no browser).
 * These test the REST API directly, verifying status codes and response shapes.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { DEMO_RESTAURANT_SLUG, DEMO_TABLE_NUMBER } from '../../helpers/test-data';

const SUPER_ADMIN_AUTH = path.join(__dirname, '../../.auth/super-admin.json');
const RESTAURANT_ADMIN_AUTH = path.join(__dirname, '../../.auth/restaurant-admin.json');

test.describe('API Routes', () => {
  test('GET /api/menu returns dishes for demo restaurant', async ({ request }) => {
    const res = await request.get(`/api/menu?restaurant=${DEMO_RESTAURANT_SLUG}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    // Each dish should have at minimum an id, name, and price
    expect(body[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      price: expect.any(Number),
    });
  });

  test('GET /api/super-admin/restaurants returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/super-admin/restaurants');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/super-admin/restaurants returns data with super admin auth', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: SUPER_ADMIN_AUTH });
    const req = await ctx.request.get('/api/super-admin/restaurants');
    expect(req.status()).toBe(200);
    const body = await req.json();
    expect(Array.isArray(body)).toBe(true);
    await ctx.close();
  });

  test('POST /api/chat accepts a message and returns a streaming response', async ({ request }) => {
    const res = await request.post('/api/chat', {
      data: {
        message: 'Hello, what do you recommend?',
        tableId: String(DEMO_TABLE_NUMBER),
        restaurantSlug: DEMO_RESTAURANT_SLUG,
      },
    });
    // Chat endpoint returns 200 with a streamed or JSON response
    expect(res.status()).toBe(200);
  });
});
