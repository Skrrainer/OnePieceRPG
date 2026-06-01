import { defineConfig } from 'vite';

export default defineConfig({
  // Default root = project root, where index.html lives
  // /src/css and /src/js paths in index.html resolve correctly from here

  // public/ folder contains manifest.json, sw.js, icons — copied to dist as-is
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  server: {
    host: 'localhost',
    open: true,
    // No hardcoded port — Vite picks freely
    // No explicit hmr config — Vite auto-matches WS to the HTTP port
  },
});
