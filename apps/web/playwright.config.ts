import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;

// Runs against the production build (prerendered static files), like Firebase Hosting serves it.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices['Pixel 7'],
    viewport: { width: 360, height: 800 },
  },
  webServer: {
    command: `python3 -m http.server ${PORT} --directory dist/web/browser`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
  },
});
