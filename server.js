import express from 'express'
import path from 'path';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';
import fetch from 'node-fetch';

dotenv.config();

const app = express()
const PORT = process.env.PORT || 3000;

const authKey = process.env.AUTH_KEY;
const secretKey = process.env.SECRET_KEY;
const userAgent = process.env.USER_AGENT;
const apiEndpoint = process.env.API_ENDPOINT;

app.use(express.static(path.join(path.resolve(), 'public')));

// Shared authentication function
function generateAuthHeader() {
  const apiHeaderTime = Math.floor(new Date().getTime() / 1000);
  const hash = CryptoJS.SHA1(authKey + secretKey + apiHeaderTime).toString(CryptoJS.enc.Hex);

  return {
    'User-Agent': userAgent,
    'X-Auth-Key': authKey,
    'X-Auth-Date': apiHeaderTime.toString(),
    'Authorization': hash,
  }
}

//Search for podcasts
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json ({ error: 'Query parameter "q" is required.' });
  }

  const headers = generateAuthHeader();

  try {
    const response = await fetch(`${apiEndpoint}/search/byterm?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: headers,
    });

    if(response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const rawText = await response.text();
      console.log('Response Error:', rawText);
      res.status(response.status).json({ error: 'Invalid response from API', rawText });
    }
  } catch (error) {
    console.error('Error fetching API:', error.message);
    res.status(500).json({ error: 'Failed to fetch podcasts' });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});