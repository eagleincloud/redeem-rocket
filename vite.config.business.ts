import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/** Serve business.html (with Vite HMR injection) for all SPA navigation routes */
function serveBusinessHtml(): Plugin {
  return {
    name: 'serve-business-html',
    configureServer(server) {
      const htmlPath = path.resolve(__dirname, 'business.html');
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/';
        // Pass through Vite internals, node_modules, and real asset requests
        const isViteInternal = url.startsWith('/@') || url.startsWith('/node_modules/') || url.startsWith('/__');
        // Only treat as a static asset if the FINAL path segment has a file extension (e.g. /foo/bar.js)
        const lastSegment = url.split('?')[0].split('/').pop() ?? '';
        const isAsset = lastSegment.includes('.') && !lastSegment.endsWith('.html');
        if (isViteInternal || isAsset) return next();
        // Redirect bare root to /business.html so the React Router basename matches
        if (url === '/' || url === '') {
          res.writeHead(302, { Location: '/business.html' });
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

// Copy business.html to index.html in build output for Vercel
function copyBusinessHtmlPlugin(): Plugin {
  return {
    name: 'copy-business-html',
    writeBundle() {
      const source = path.resolve(__dirname, 'dist-business/business.html');
      const dest = path.resolve(__dirname, 'dist-business/index.html');
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveBusinessHtml(), copyBusinessHtmlPlugin()],
  server: { port: 5174 },
  publicDir: 'public',
  build: {
    outDir: 'dist-business',
    rollupOptions: {
      input: path.resolve(__dirname, 'business.html'),
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  assetsInclude: ['**/*.svg', '**/*.csv', '**/*.png', '**/*.jpeg'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
