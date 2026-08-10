import { expect, test } from '@playwright/test';

const DEV_SECRET = 'e2e-dev-login-secret';

test.describe('Cabinet (360px)', () => {
  test('an anonymous visitor is asked to sign in', async ({ page }) => {
    await page.goto('/cabinet');
    await expect(page.getByRole('heading', { name: 'Rieltor kabineti' })).toBeVisible();
  });

  test('a signed-in realtor sees their profile and can edit it', async ({ page, context }) => {
    const response = await context.request.post('/api/auth/dev', {
      data: { secret: DEV_SECRET, tgId: 990100, name: 'E2e Rieltor' },
    });
    expect(response.status()).toBe(201);

    await page.goto('/cabinet');
    await expect(page.getByText('E2e Rieltor')).toBeVisible();
    await expect(page.getByText(/Telefon raqami kiritilmagan/)).toBeVisible();

    await page.getByRole('link', { name: /Profilni tahrirlash/ }).click();
    await page.getByLabel('Telefon').fill('+998901234567');
    await page.getByRole('button', { name: 'Saqlash' }).click();
    await expect(page.getByText('Saqlandi')).toBeVisible();

    await page.goto('/cabinet');
    await expect(page.getByText(/Telefon raqami kiritilmagan/)).toHaveCount(0);
  });

  test('there is no horizontal scroll', async ({ page }) => {
    await page.goto('/cabinet');
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
