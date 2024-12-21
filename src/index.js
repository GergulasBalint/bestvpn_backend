import { Router } from 'itty-router';

// Create a new router
const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Add a root route handler
router.get('/', () => {
  return new Response('VPN News API is running!', {
    headers: {
      'Content-Type': 'text/plain',
      ...corsHeaders
    }
  });
});

// Handle OPTIONS requests
router.options('*', () => new Response(null, {
  headers: corsHeaders
}));

// Helper function to extract content between XML tags
function getTagContent(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gs');
  const matches = [...xml.matchAll(regex)];
  return matches.map(match => match[1].trim());
}

// Helper function to parse a single item
function parseItem(itemXml) {
  return {
    title: getTagContent(itemXml, 'title')[0] || '',
    link: getTagContent(itemXml, 'link')[0] || '',
    description: getTagContent(itemXml, 'description')[0] || '',
    pubDate: getTagContent(itemXml, 'pubDate')[0] || '',
  };
}

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
    
    // Split XML into items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [...xmlText.matchAll(itemRegex)];
    
    // Parse each item
    const news = items.map(item => parseItem(item[0]));

    return new Response(JSON.stringify({ rss: { channel: [{ item: news }] } }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    // Return more detailed error information
    return new Response(JSON.stringify({ 
      error: 'Error fetching news data',
      details: error.message,
      stack: error.stack
    }), {
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