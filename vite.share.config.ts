import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: false,
  build: { outDir: process.env.OUT, emptyOutDir: true, modulePreload: false, assetsInlineLimit: 100000000, cssCodeSplit: false, chunkSizeWarningLimit: 5000 },
});
