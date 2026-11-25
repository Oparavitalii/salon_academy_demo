import { defineConfig, devices } from '@playwright/test';

/**
 * Scenario tests per role: `setup` logs the test admin and the test student in once and saves their
 * sessions; each role project reuses it. Runs against a running production build: `E2E_BASE_URL`
 * (default http://localhost:3100). Credentials: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD /
 * E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD, else the public demo accounts (DEMO_MODE=1).
 * Public demo: `npm run demo:build && npm run demo:start -- -p 3100`, then `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'setup', testMatch: /Global_Setup\.ts/ },
    {
      name: 'anonymous',
      testMatch: /(Anonymous|New_Blocks|A11y)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'anonymous-phone',
      testMatch: /Phone(_New)?\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    // The owner and the clients use iPhones: the phone scenarios again on WebKit (Safari's engine).
    {
      name: 'iphone',
      testMatch: /Phone(_New)?\.spec\.ts/,
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'student',
      testMatch: /Student\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/student.json',
      },
    },
    {
      name: 'admin',
      testMatch: /Admin\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
    },
  ],
});
