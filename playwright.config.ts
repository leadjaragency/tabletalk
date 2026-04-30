import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  // Root of all test files — setup files live in tests/, specs in tests/e2e/
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 2,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Auth setup — runs once before all other projects
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },
    // Desktop Chromium — only runs spec files inside e2e/
    {
      name: 'chromium',
      testMatch: /e2e[\\/].*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // Mobile Chrome (Pixel 5 — 393x851)
    {
      name: 'mobile-chrome',
      testMatch: /e2e[\\/].*\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
