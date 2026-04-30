import { test, expect } from '../../fixtures/auth';

test.describe('Admin QR Codes', () => {
  test('QR cards render for each table', async ({ adminPage: page }) => {
    await page.goto('/admin/qr-codes');
    // At least one QR code card per table
    await expect(page.locator('text=/Table/i').first()).toBeVisible({ timeout: 15_000 });
    // SVG or img element for the QR code
    await expect(page.locator('svg, img[alt*="QR" i], canvas').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Print All button is present and clickable', async ({ adminPage: page }) => {
    await page.goto('/admin/qr-codes');
    const printBtn = page.locator('button:has-text("Print All"), button:has-text("Download PDF")');
    await expect(printBtn.first()).toBeVisible({ timeout: 15_000 });
    // Should not throw when clicked (PDF generation or print dialog may open)
    await printBtn.first().click({ timeout: 5_000 });
  });
});
