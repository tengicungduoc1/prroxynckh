const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: true,
    timeout: 120000,
    proxyTimeout: 120000,

    pathRewrite: (path, req) => {
      let newPath = path.replace(/^\/proxy/, ''); // Bỏ "/proxy"
      const originalQuery = req.url.split('?')[1] || ''; // Lấy query string gốc (nếu có)
      const newQuery = originalQuery.includes('apikey=')
        ? originalQuery // Nếu đã có apikey, giữ nguyên
        : `${originalQuery}&apikey=${API_KEY}`; // Nếu chưa có, thêm vào cuối
      return `${newPath}?${newQuery}`;
    },

    onProxyReq: (proxyReq, req) => {
      console.log('Forwarding to:', `${SUPABASE_URL}${req.url}`);
    },

    onProxyRes: (proxyRes, req, res) => {
      console.log('Response received from Supabase');
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    },
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
