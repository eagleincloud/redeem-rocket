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
})
