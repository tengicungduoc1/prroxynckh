const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const querystring = require('querystring');

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

    // Xử lý path và query parameters
    pathRewrite: (path, req) => {
      // 1. Loại bỏ tiền tố /proxy
      const newPath = path.replace(/^\/proxy/, '');
      
      // 2. Phân tích query hiện tại
      const parsed = new URL('http://localhost' + path);
      const searchParams = parsed.searchParams;
      
      // 3. Thêm API key nếu chưa có
      if (!searchParams.has('apikey')) {
        searchParams.append('apikey', API_KEY);
      }
      
      // 4. Tạo path mới với query đã được encode
      return `${parsed.pathname}?${searchParams.toString()}`;
    },

    // Xử lý body cho POST/PUT
    onProxyReq: (proxyReq, req) => {
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = proxyReq.getHeader('Content-Type');
        let bodyData;
        
        if (contentType === 'application/json') {
          bodyData = JSON.stringify(req.body);
        }
        
        if (contentType === 'application/x-www-form-urlencoded') {
          bodyData = querystring.stringify(req.body);
        }
        
        if (bodyData) {
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error' });
    }
  })
);

// Giữ nguyên phần lấy thời gian
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});