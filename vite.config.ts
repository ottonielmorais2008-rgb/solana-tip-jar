import { copyFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const pagesBase = '/solana-tip-jar/'

export default defineConfig(({ command, isPreview }) => ({
  // Dev stays at /. Preview uses the same base as the GitHub Pages build.
  base: command === 'serve' && !isPreview ? '/' : pagesBase,
  plugins: [
    react(),
    {
      name: 'github-pages-spa-fallback',
      apply: 'build',
      closeBundle() {
        const dist = path.resolve('dist')
        copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
      },
    },
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
