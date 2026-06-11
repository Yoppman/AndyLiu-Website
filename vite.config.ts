import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // react-three-fiber requires a single copy of three; dedupe avoids the
    // "multiple instances of three" class of bugs and extra payload.
    dedupe: ['three', 'react', 'react-dom'],
  },
  // The home page's WebGL acts are now lazy, so Vite's entry scan no longer
  // finds three / react-three-fiber up front. Pre-bundle just those two so the
  // first scroll into a WebGL act doesn't trigger a mid-session re-optimize +
  // full-page reload (which looks like the dev server "hanging"). Route-only
  // heavies (maplibre-gl, leaflet) are intentionally left out — they optimize
  // on demand when you actually navigate to /map or /contact, so they don't
  // slow down every startup.
  optimizeDeps: {
    include: ['three', '@react-three/fiber'],
  },
  base: '/',
  server: {
    port: 5173,
    host: true
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name;
          if (!name) return 'assets/[name]-[hash].[ext]';

          const info = name.split('.');
          const ext = info[info.length - 1];
          if (/pdf/i.test(ext)) {
            return `[name].[ext]`; // Keep PDFs at root level
          }
          return `assets/[name]-[hash].[ext]`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
});