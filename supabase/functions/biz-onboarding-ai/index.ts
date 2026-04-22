import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { describeBusiness } from './llm.ts';
import { extractFromURL } from './extractors.ts';
import { parseNaturalLanguage } from './parsers.ts';
import { buildProductsFromWebsite } from './product-builder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    console.log(`[biz-onboarding-ai] Route: ${pathname}`);

    if (pathname.includes('/describe')) {
      const body = await req.json();
      const { businessType, businessName, websiteText } = body;

      if (!businessType || !businessName) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const descriptions = await describeBusiness(businessType, businessName, websiteText);
      return new Response(JSON.stringify({ descriptions }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pathname.includes('/extract-from-url')) {
      const body = await req.json();
      const { url: targetUrl, businessType } = body;

      if (!targetUrl) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: url' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const extractedData = await extractFromURL(targetUrl, businessType);
      return new Response(JSON.stringify(extractedData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pathname.includes('/parse-natural-language')) {
      const body = await req.json();
      const { text } = body;

      if (!text) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: text' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const parsedData = await parseNaturalLanguage(text);
      return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pathname.includes('/build-products')) {
      const body = await req.json();
      const { url: targetUrl, businessType, businessName } = body;

      if (!targetUrl || !businessType || !businessName) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const products = await buildProductsFromWebsite(targetUrl, businessType, businessName);
      return new Response(JSON.stringify({ products }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        error: 'Not found',
        available_routes: ['/describe', '/extract-from-url', '/parse-natural-language', '/build-products'],
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[biz-onboarding-ai] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
