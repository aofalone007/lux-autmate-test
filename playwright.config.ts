import { defineConfig, devices } from '@playwright/test';

const ENV = process.env.ENV ?? 'dev';

const baseURLMap: Record<string, string> = {
  dev: 'https://dev-th.nonprod-lux.com',
  stg: 'https://stg-th.nonprod-lux.com',
  uat: 'https://m.uatzgaming.com',
};

const baseURL = baseURLMap[ENV];

if (!baseURL) {
  throw new Error(`ENV "${ENV}" ไม่ถูกต้อง — ใช้ได้แค่: dev | stg | uat`);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60_000,

  use: {
    baseURL,
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: `chromium-${ENV}`,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});