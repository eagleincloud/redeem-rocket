// URL Data Extraction Module

import { generateSampleProducts } from './llm.ts';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    let fetchUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fetchUrl = `https://${url}`;
    }

    console.log(`[fetchWebsiteContent] Fetching: ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    const cleaned = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned.substring(0, 3000);
  } catch (error) {
    console.error('[fetchWebsiteContent] Error:', error);
    throw new Error(`Failed to fetch website`);
  }
}

export async function extractFromURL(url: string, businessType?: string): Promise<any> {
  try {
    console.log(`[extractFromURL] Extracting from: ${url}`);

    const websiteText = await fetchWebsiteContent(url);
    console.log(`[extractFromURL] Fetched ${websiteText.length} characters`);

    return {
      success: true,
      url,
      businessDescription: `Learn more about our ${businessType || 'business'} offerings`,
    };
  } catch (error) {
    console.error('[extractFromURL] Error:', error);

    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
