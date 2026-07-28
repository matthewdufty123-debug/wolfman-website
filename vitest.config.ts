import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Component tests only. E2E lives in tests/e2e and is driven by Playwright.
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: false,
  },
})
