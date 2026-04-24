import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // 預設 node 環境；只有 .tsx 元件測試套用 jsdom
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
    ],
    setupFiles: ['./src/test-setup.ts'],
    env: {
      DATABASE_PATH: ':memory:',
    },
  },
})
