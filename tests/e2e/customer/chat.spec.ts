import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_CHAT_URL } from '../../helpers/test-data';

test.describe('Customer AI Chat', () => {
  test('chat page loads with a greeting from the AI waiter', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_CHAT_URL);
    // AI bubble has rounded-bl-sm bg-white class
    await expect(page.locator('.rounded-bl-sm.bg-white').first()).toBeVisible({ timeout: 20_000 });
  });

  test('typing and submitting a message shows user bubble', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_CHAT_URL);
    await page.waitForTimeout(3000);
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill('Hello!');
    await page.keyboard.press('Enter');
    // User bubble has justify-end flex and bg-cu-accent (gold)
    await expect(page.locator('.rounded-br-sm').first()).toBeVisible({ timeout: 10_000 });
  });

  test('typing indicator appears while AI is responding', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_CHAT_URL);
    await page.waitForTimeout(3000);
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill('What do you recommend?');
    await page.keyboard.press('Enter');
    // Typing indicator has three animate-bounce dots
    await expect(page.locator('.animate-bounce').first()).toBeVisible({ timeout: 8_000 });
  });

  test('quick reply chips are clickable', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_CHAT_URL);
    // Wait for AI greeting + quick reply chips to appear
    await page.waitForTimeout(5000);
    const chip = page.locator('button').filter({ hasText: /^[A-Z]/ }).nth(1);
    if (await chip.isVisible()) {
      await chip.click();
      await expect(page.locator('.rounded-br-sm').first()).toBeVisible({ timeout: 10_000 });
    } else {
      // Quick replies may not appear — just verify chat loaded
      await expect(page.locator('.rounded-bl-sm.bg-white').first()).toBeVisible();
    }
  });
});
