import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  use: {
    baseURL: 'https://app-creation-request-2.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 30000, // 30 seconds for navigation
    actionTimeout: 15000, // 15 seconds for actions
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev:business',
    url: 'http://localhost:5174/business.html',
    reuseExistingServer: !process.env.CI,
  },
});
