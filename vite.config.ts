import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  // Phaser alone is ~1.2 MB minified; that's expected.
  build: { chunkSizeWarningLimit: 2000 },
});
