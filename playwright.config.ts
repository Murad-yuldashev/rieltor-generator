import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
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
