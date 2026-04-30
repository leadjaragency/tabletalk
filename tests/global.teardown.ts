/**
 * Runs once after all test projects complete.
 * Currently a no-op — the test DB is seeded fresh before each full run.
 * Add cleanup here if tests create data that must be removed (e.g. new restaurants).
 */

import { test as teardown } from '@playwright/test';

teardown('cleanup after tests', async () => {
  // No-op: seed data is idempotent; tests that create records clean up after themselves.
});
