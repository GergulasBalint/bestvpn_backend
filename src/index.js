import { Router } from 'itty-router';

// Create a new router
const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS requests
router.options('*', () => new Response(null, {
  headers: corsHeaders
}));

// Convert your existing /api/news route to Workers format
router.get('/api/news', async (request) => {
  try {
    const response = await fetch('https://uk.pcmag.com/vpn.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parse XML using DOMParser (available in Workers runtime)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Convert XML to JSON
    const items = xmlDoc.querySelectorAll('item');
    const news = Array.from(items).map(item => ({
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      description: item.querySelector('description')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
    }));

    return new Response(JSON.stringify({ rss: { channel: [{ item: news }] } }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error fetching news data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// 404 for everything else
router.all('*', () => new Response('Not Found', { status: 404 }));

// Export the worker handler
export default {
  fetch: router.handle
}; 