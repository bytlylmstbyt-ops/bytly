import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    // Disable Vite's native HMR WebSocket — it fails in the iframe preview
    // environment ("WebSocket closed without opened"). The base44 plugin's
    // hmrNotifier handles reloads instead.
    hmr: false
  },
  build: {
    // Production minification (esbuild = fast + effective tree-shaking)
    minify: 'esbuild',
    cssMinify: true,
    // Split CSS per-chunk so unused page styles aren't loaded upfront
    cssCodeSplit: true,
    // Warn only on genuinely large chunks
    chunkSizeWarningLimit: 1000,
    // Target modern browsers — smaller, more tree-shakeable output
    target: 'es2020',
    rollupOptions: {
      output: {
        // Manual chunking of heavy third-party libs so they cache independently
        // and don't bloat the main entry / per-route chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router') || /[\\/]react[\\/]/.test(id) || /[\\/]react-dom[\\/]/.test(id)) return 'react-vendor';
          if (id.includes('recharts') || id.includes('d3-')) return 'recharts';
          if (/[\\/]three[\\/]/.test(id)) return 'three';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('framer-motion')) return 'framer';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('@hello-pangea')) return 'dnd';
          if (id.includes('@tanstack')) return 'tanstack';
          if (id.includes('@stripe')) return 'stripe';
          if (id.includes('date-fns') || id.includes('lodash') || id.includes('moment')) return 'utils-vendor';
          return undefined;
        },
      },
    },
  },
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: false,
      navigationNotifier: false,
      visualEditAgent: false
    }),
    react(),
  ]
});