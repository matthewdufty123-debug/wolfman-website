import { defineConfig, devices } from '@playwright/test'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

const PORT = 3100
export const BASE_URL = `http://localhost:${PORT}`

/**
 * Some sandboxes ship a pre-installed Chromium whose build number doesn't match
 * the one this Playwright version expects. Point at it when it's there;
 * otherwise let Playwright use its own download (the normal case on a laptop).
 */
function findChromium(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (!root || !existsSync(root)) return undefined
  for (const dir of readdirSync(root)) {
    if (!dir.startsWith('chromium-')) continue
    const bin = join(root, dir, 'chrome-linux', 'chrome')
    if (existsSync(bin)) return bin
  }
  return undefined
}

const executablePath = findChromium()

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['list']] : [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  // Generous, because the dev server compiles each route on first hit and the
  // reading page streams its sections in behind Suspense boundaries.
  expect: { timeout: 20_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },

  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], ...(executablePath ? { launchOptions: { executablePath } } : {}) },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], ...(executablePath ? { launchOptions: { executablePath } } : {}) },
    },
  ],

  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `${BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...(Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined),
      ) as Record<string, string>),
    },
  },
})
