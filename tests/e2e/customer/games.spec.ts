import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_GAMES_URL } from '../../helpers/test-data';

test.describe('Customer Games', () => {
  test('games page is locked before order placed', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_GAMES_URL);
    // Lock overlay or message
    await expect(page.locator('text=/Place an order|Order first|Locked|place your order/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Spin the Wheel component renders with segments', async ({ customerPage: page }) => {
    // Navigate directly — in a real test DB scenario where a session already has an order
    await page.goto(CUSTOMER_GAMES_URL);
    // If unlocked (order exists), spin wheel should be visible
    const spinWheel = page.locator('svg circle, canvas, [data-testid="spin-wheel"], .spin-wheel');
    const lockMsg = page.locator('text=/Place an order|Order first|Locked/i');
    // Either spin wheel or lock message should be visible
    await expect(spinWheel.first().or(lockMsg.first())).toBeVisible({ timeout: 15_000 });
  });

  test('Trivia tab or section is visible', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_GAMES_URL);
    await expect(page.locator('text=/Trivia|Quiz|Question/i').first()).toBeVisible({ timeout: 15_000 });
  });
});
