import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
    /* Vite fingerprints every emitted asset (app-<hash>.js), so nginx's
     * `expires 7d` rule can no longer serve a stale bundle — a new build
     * produces a new filename and index.html (no-cache) points at it. */
  },
  server: {
    host: '127.0.0.1',
    port: 5183
  }
});
