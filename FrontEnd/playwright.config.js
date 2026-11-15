import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../qa-reportes/playwright', open: 'never' }],
  ],
  outputDir: '../qa-reportes/playwright-artifacts',
  use: {
    baseURL: process.env.ASIS_UI_URL || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Se espera que ASIS ya esté iniciado con docker compose up -d --build.
});
