import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { execSync } from 'child_process';



function getGitInfo() {
  let commit = 'unknown';
  let uncommitted = 0;

  try {
    commit = execSync('git rev-parse --short HEAD').toString().trim();
    const status = execSync('git status --porcelain').toString().trim();
    // Each line in the output represents a modified/untracked file
    uncommitted = status ? status.split('\n').length : 0;
  } catch {
    // ignore errors
  }

  return { commit, uncommitted };
}

const gitInfo = getGitInfo();

// https://vite.dev/config/
export default defineConfig({
    define: {
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(new Date().toISOString()),
    'import.meta.env.LAST_COMMIT': JSON.stringify(gitInfo.commit),
    'import.meta.env.NOT_COMMITED': JSON.stringify(gitInfo.uncommitted)

  },
  base: '/GTNH_SpiceOfLifeHistoryExtract/',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
