// Use fetch for HTTP routing instead of file system reads
// This works better with Vercel's deployment model

export default async function handler(req: any, res: any) {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;

  try {
    let fileToServe: string;

    // Determine which app to serve based on path
    if (pathname.startsWith('/admin')) {
      // Route admin requests to admin/index.html
      fileToServe = '/admin/index.html';
    } else {
      // Route all other requests to business.html
      fileToServe = '/business.html';
    }

    // Fetch the appropriate HTML from the deployment
    const url = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}${fileToServe}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send('Not Found');
    }

    const html = await response.text();

    // Set proper headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');

    // Return the HTML
    res.status(200).send(html);
  } catch (error: any) {
    console.error('Error serving HTML:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
}
