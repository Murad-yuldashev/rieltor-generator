import { expect, test } from '@playwright/test';

test.describe('Listing page (360px)', () => {
  test('the page opens with its main blocks', async ({ page }) => {
    await page.goto('/obj/bx-002');

    await expect(page.getByText("1 420 455 400 so'm")).toBeVisible();
    await expect(page.getByText('$119 000')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('there is no horizontal scroll', async ({ page }) => {
    await page.goto('/obj/bx-002');
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('swiping the gallery changes the active dot', async ({ page }) => {
    await page.goto('/obj/bx-002');

    const dots = page.getByRole('tab');
    await expect(dots.first()).toHaveAttribute('aria-selected', 'true');

    // Clicking the second dot scrolls the strip (same result as a swipe).
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(dots.first()).toHaveAttribute('aria-selected', 'false');
  });

  test('the CTA buttons have the right links', async ({ page }) => {
    await page.goto('/obj/bx-002');

    const callLink = page.getByRole('link', { name: /Qo'ng'iroq/ });
    await expect(callLink).toHaveAttribute('href', /^tel:\+998\d+$/);

    const telegram = page.getByRole('link', { name: /Telegram/ });
    await expect(telegram).toHaveAttribute('href', /^https:\/\/t\.me\/[\w_]+$/);
  });

  test('the CTA stays visible on screen', async ({ page }) => {
    await page.goto('/obj/bx-002');
    await page.mouse.wheel(0, 2000);
    await expect(page.getByRole('link', { name: /Qo'ng'iroq/ })).toBeInViewport();
  });

  test('the view counter is visible', async ({ page }) => {
    await page.goto('/obj/bx-002');
    await expect(page.getByText(/\d+ marta ko'rildi/)).toBeVisible();
  });

  test('an unknown id gives the 404 page and a 404 status', async ({ page }) => {
    const response = await page.goto('/obj/yoq-000');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Bunday obyekt topilmadi')).toBeVisible();
  });

  test('the OG tags are present in the HTML', async ({ request }) => {
    const response = await request.get('/obj/bx-002');
    const html = await response.text();

    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toMatch(/property="og:image" content="https?:\/\//);
  });
});
