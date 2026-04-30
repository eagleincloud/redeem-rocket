import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Intelligent routing handler for dual-app deployment
 * Routes requests to either business or admin app based on the request path
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url || '/';

  // Determine if this is an admin request
  const isAdminRoute = path.startsWith('/admin');

  try {
    let htmlFile: string;
    let filePath: string;

    if (isAdminRoute) {
      // Route to admin app
      filePath = join(process.cwd(), 'dist-business', 'admin', 'index.html');
      htmlFile = readFileSync(filePath, 'utf-8');
    } else {
      // Route to business app
      filePath = join(process.cwd(), 'dist-business', 'business.html');
      htmlFile = readFileSync(filePath, 'utf-8');
    }

    // Set proper headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');

    // Return the HTML
    res.status(200).send(htmlFile);
  } catch (error) {
    console.error('Error serving HTML:', error);
    res.status(500).send('Internal Server Error');
  }
}
