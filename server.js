const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Route to get VPN news
app.get('/api/news', async (req, res) => {
  console.log('Received request for /api/news');
  try {
    console.log('Attempting to fetch from PCMag...');
    const response = await axios.get('https://uk.pcmag.com/vpn.xml', {
      timeout: 5000,
      validateStatus: status => status === 200,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('Received response from PCMag');
    if (!response.data) {
      console.log('Empty response received');
      throw new Error('Empty response received');
    }

    console.log('Parsing XML data...');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    console.log('XML parsed successfully');
    // Validate the expected structure
    if (!result?.rss?.channel?.[0]?.item) {
      console.log('Invalid RSS format:', result);
      throw new Error('Invalid RSS format');
    }

    console.log('Sending response to client');
    res.json(result);
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Stack trace:', error.stack);
    const errorMessage = error.response?.status ? 
      `External API error: ${error.response.status}` : 
      'Error fetching news data';
    res.status(500).json({ error: errorMessage });
  }
});

// Add error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 