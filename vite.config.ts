import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [preact()],
  build: {
    outDir: resolve('dist', mode === 'firefox' ? 'firefox' : 'chromium'),
    modulePreload: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        extension: resolve('extension.html'),
        background: resolve('src/background/main.ts'),
      },
      output: {
        entryFileNames: (chunk) => chunk.name === 'background' ? 'background.js' : 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        format: 'es',
      },
    },
  },
}));
