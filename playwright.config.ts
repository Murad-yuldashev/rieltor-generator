import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // CI'da ikkita reporter: 'github' PR ichida annotatsiya qoldiradi, 'html' esa
  // playwright-report/ papkasini yozadi. CI dagi `if: failure()` qadami aynan o'sha
  // papkani artefakt qilib yuklaydi — faqat 'github' bo'lsa yuklashga hech narsa
  // topilmaydi va yiqilgan CI ni tekshirayotgan odam bo'sh arxiv oladi.
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobil',
      use: {
        ...devices['Pixel 5'],
        // Spec §13: 360px kenglikda mukammal ishlashi kerak.
        viewport: { width: 360, height: 740 },
      },
    },
  ],
});
