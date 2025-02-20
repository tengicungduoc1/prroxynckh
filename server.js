const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const url = require('url');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false,
    timeout: 120000,
    proxyTimeout: 120000,

    // Sử dụng req.originalUrl để có được URL gốc của client
    pathRewrite: (path, req) => {
      // Phân tích URL gốc (bao gồm cả query string)
      const parsedUrl = url.parse(req.originalUrl, true);
      // Loại bỏ tiền tố "/proxy" khỏi pathname
      const pathname = parsedUrl.pathname.replace(/^\/proxy/, '');
      
      // Nếu query không có apikey, thêm vào
      if (!parsedUrl.query.apikey) {
        parsedUrl.query.apikey = API_KEY;
      }
      
      // Dùng URLSearchParams để xây dựng lại query string chính xác
      const newQuery = new URLSearchParams(parsedUrl.query).toString();
      
      return `${pathname}?${newQuery}`;
    },

    // Thêm API Key vào header của request
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('apikey', API_KEY);
      console.log(`Proxying: ${req.method} ${req.originalUrl}`);
      
      // Nếu có body và là phương thức POST/PUT/PATCH, truyền dữ liệu
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },

    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
      });
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    },
  })
);

// API trả về thời gian Việt Nam
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
