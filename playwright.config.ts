import { defineConfig, devices } from '@playwright/test'

/**
 * VRTX-0407 FIX: E2E tests returning 404 for new endpoints
 *
 * Root Cause: The 1012136249 endpoints were returning HTTP 404 in E2E tests
 * because Playwright was reusing an existing server process that didn't have
 * the new routes registered. The `reuseExistingServer: true` setting in local
 * development caused Playwright to skip rebuilding and restarting the server,
 * so it used an old server instance without the new routes.
 *
 * Solution: Set `reuseExistingServer: false` to force a fresh server start
 * for each E2E test run. This ensures all routes including new 1012136249
 * endpoints are properly built and registered before tests run.
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'bun run start',
    url: 'http://localhost:3000',
    // VRTX-0407 FIX: Do not reuse existing server to ensure fresh route registration
    // In the old configuration, `reuseExistingServer: !process.env.CI` would keep
    // a stale server running locally, causing new endpoints to return 404.
    // By setting reuseExistingServer to false, we ensure:
    // 1. A fresh build is always performed
    // 2. All routes are properly registered
    // 3. The 1012136249 endpoints are available for E2E tests
    // 4. Both CI and local dev environments work consistently
    reuseExistingServer: false,
    timeout: 60000,  // 60 seconds max wait for fresh build + server startup
  },
})
