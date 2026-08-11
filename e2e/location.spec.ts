import { expect, test } from '@playwright/test';

/** Yunusobod — far from the Sergeli and Chilonzor listings, so the order is decisive. */
test.use({
  geolocation: { latitude: 41.3675, longitude: 69.2894 },
  permissions: ['geolocation'],
});

test.describe('Location (360px)', () => {
  test('detects the district and shows it in the header', async ({ page }) => {
    await page.goto('/');
    // The chip's visible/accessible text drops the " tumani" suffix to save space
    // (see location-chip.tsx); the full district name survives on the `title`
    // attribute, so that's what this locates.
    await expect(page.getByTitle(/Yunusobod tumani/)).toBeVisible();
  });

  test('sorting by distance puts the nearest listing first', async ({ page }) => {
    await page.goto('/');

    const titles = page.locator('article h3');
    const before = await titles.first().textContent();

    await page.getByLabel('Saralash tartibi').selectOption('NEAR');
    await expect(page.getByText(/Saralash: Yaqin/)).toBeVisible();

    // The first card now carries a distance badge, and the order has changed.
    // Anchored so it can't also match the price ("... so'm"), which happens to end in "m" too.
    await expect(
      page
        .locator('article')
        .first()
        .getByText(/^\d[\d.,]*\s(km|m)$/),
    ).toBeVisible();
    expect(await titles.first().textContent()).not.toBe(before);
  });

  test('there is no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
