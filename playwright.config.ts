import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Two reporters on CI: 'github' annotates the pull request while 'html' writes
  // the playwright-report/ folder. The `if: failure()` step uploads exactly that
  // folder as an artifact — with only 'github' there would be nothing to upload,
  // and whoever investigates the failed run would get an empty archive.
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
        // Spec §13: it has to work perfectly at 360px wide.
        viewport: { width: 360, height: 740 },
      },
    },
  ],
});
