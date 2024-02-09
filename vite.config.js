import million from 'million/compiler';
import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import manifest from './src/manifest.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      emptyOutDir: true,
      outDir: 'build',
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
        // external: (p) => p.includes('dom.js')
      },
    },
    server: {
      watch: {
        includes: [
          './src/background/index.js',
          './public/script.js'
        ]
      },
    },
    plugins: [million.vite({ 
      auto: false 
    }), crx({ manifest }), react()],
  }
})
