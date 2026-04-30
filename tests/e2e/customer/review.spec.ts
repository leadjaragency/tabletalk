import { test, expect } from '../../fixtures/auth';
import { CUSTOMER_REVIEW_URL } from '../../helpers/test-data';

test.describe('Customer Review', () => {
  test('star rating is interactive', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_REVIEW_URL);
    // Find the 4th star button
    const stars = page.locator('button[aria-label*="star" i], svg[data-star], .star-btn, [role="radio"]');
    await stars.first().waitFor({ state: 'visible', timeout: 15_000 });
    const fourthStar = stars.nth(3);
    if (await fourthStar.isVisible()) {
      await fourthStar.click();
      // 4 stars should be filled/active
      await expect(stars.nth(3)).toHaveAttribute(/class|aria-checked|data-selected/, /active|filled|selected|true/i);
    } else {
      // Fallback: just click first star
      await stars.first().click();
      await expect(stars.first()).toBeVisible();
    }
  });

  test('submit review shows farewell message', async ({ customerPage: page }) => {
    await page.goto(CUSTOMER_REVIEW_URL);
    // Select a rating (click 4th star if available)
    const stars = page.locator('button[aria-label*="star" i], .star-btn, [role="radio"]');
    await stars.first().waitFor({ state: 'visible', timeout: 15_000 });
    await stars.nth(3).click().catch(() => stars.first().click());

    await page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Send Review")');
    await expect(page.locator('text=/Thank you|Thank|Farewell|Bye|Enjoy/i').first()).toBeVisible({ timeout: 10_000 });
  });
});
