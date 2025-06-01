import { fileURLToPath, URL } from 'node:url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/GTNH_SpiceOfLifeHistoryExtract/',
  plugins: [
    vue(),
    vueDevTools(),
    nodePolyfills()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),

      zlib: 'browserify-zlib',
      stream: 'stream-browserify',
      buffer: 'buffer',
      events: 'events/',
      assert: 'assert/',
      crypto: 'crypto-browserify',
      path: 'path-browserify',
      constants: 'constants-browserify',
      os: 'os-browserify/browser',
      http: 'http-browserify',
      https: 'https-browserify',
      timers: 'timers-browserify',

      // Disable unsupported modules
      jose: false,
      fs: false,
      tls: false,
      child_process: false,
      perf_hooks: '/src/lib/perf_hooks_replacement.js',
      dns: '/src/lib/dns.js'
    },
  },
})
