import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/** Serve admin.html (with Vite HMR injection) for all SPA navigation routes */
function serveAdminHtml(): Plugin {
  return {
    name: 'serve-admin-html',
    configureServer(server) {
      const htmlPath = path.resolve(__dirname, 'admin.html');
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/';
        // Pass through Vite internals, node_modules, and real asset requests
        const isViteInternal = url.startsWith('/@') || url.startsWith('/node_modules/') || url.startsWith('/__');
        // Only treat as a static asset if the FINAL path segment has a file extension (e.g. /foo/bar.js)
        const lastSegment = url.split('?')[0].split('/').pop() ?? '';
        const isAsset = lastSegment.includes('.') && !lastSegment.endsWith('.html');
        if (isViteInternal || isAsset) return next();
        // Redirect bare root to /admin.html so the React Router basename matches
        if (url === '/' || url === '') {
          res.writeHead(302, { Location: '/admin.html' });
          res.end();
          return;
        }
        try {
          const raw = fs.readFileSync(htmlPath, 'utf-8');
          const html = await server.transformIndexHtml(url, raw, req.originalUrl);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveAdminHtml()],
  server: { port: 5175 },
  build: {
    outDir: 'dist-admin',
    rollupOptions: {
      input: path.resolve(__dirname, 'admin.html'),
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
