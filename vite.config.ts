import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    {
      // Serve business.html for any sub-path like /business.html/outreach
      // so React Router client-side navigation works on direct URL access
      name: 'business-app-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && req.url.startsWith('/business.html/')) {
            req.url = '/business.html';
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Code splitting optimization for large bundles
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split heavy third-party libs
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          'vendor-maps': ['leaflet', 'leaflet-routing-machine', 'leaflet.markercluster', 'react-leaflet', 'maplibre-gl', '@vis.gl/react-google-maps'],
          'vendor-forms': ['react-hook-form', 'react-dnd', 'react-dnd-html5-backend'],
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js'],
          'vendor-other': ['date-fns', 'clsx', 'class-variance-authority', 'lucide-react', 'motion', 'firebase', 'qrcode.react', 'bcryptjs'],
        },
      },
    },
    // Optimize chunk size thresholds
    chunkSizeWarningLimit: 150,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
