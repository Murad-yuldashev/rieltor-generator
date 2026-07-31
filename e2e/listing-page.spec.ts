import { expect, test } from '@playwright/test';

test.describe('Obyekt sahifasi (360px)', () => {
  test('sahifa asosiy bloklar bilan ochiladi', async ({ page }) => {
    await page.goto('/obj/bx-002');

    await expect(page.getByText("644 476 910 so'm")).toBeVisible();
    await expect(page.getByText('$53 900')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test("gorizontal skroll yo'q", async ({ page }) => {
    await page.goto('/obj/bx-002');
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test("galereya svaypi faol nuqtani o'zgartiradi", async ({ page }) => {
    await page.goto('/obj/bx-002');

    const dots = page.getByRole('tab');
    await expect(dots.first()).toHaveAttribute('aria-selected', 'true');

    // Ikkinchi nuqtaga bosish lentani suradi (svayp bilan bir xil natija).
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(dots.first()).toHaveAttribute('aria-selected', 'false');
  });

  test("CTA tugmalari to'g'ri havolalarga ega", async ({ page }) => {
    await page.goto('/obj/bx-002');

    const callLink = page.getByRole('link', { name: /Qo'ng'iroq/ });
    await expect(callLink).toHaveAttribute('href', /^tel:\+998\d+$/);

    const telegram = page.getByRole('link', { name: /Telegram/ });
    await expect(telegram).toHaveAttribute('href', /^https:\/\/t\.me\/[\w_]+$/);
  });

  test("CTA doim ekranda ko'rinadi", async ({ page }) => {
    await page.goto('/obj/bx-002');
    await page.mouse.wheel(0, 2000);
    await expect(page.getByRole('link', { name: /Qo'ng'iroq/ })).toBeInViewport();
  });

  test("hisoblagich ko'rinadi", async ({ page }) => {
    await page.goto('/obj/bx-002');
    await expect(page.getByText(/👁\s*\d+/)).toBeVisible();
  });

  test("noto'g'ri id → 404 sahifa va 404 status", async ({ page }) => {
    const response = await page.goto('/obj/yoq-000');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Bunday obyekt topilmadi')).toBeVisible();
  });

  test('OG teglari HTML ichida mavjud', async ({ request }) => {
    const response = await request.get('/obj/bx-002');
    const html = await response.text();

    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toMatch(/property="og:image" content="https?:\/\//);
  });
});
