const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const bodyParser = require('body-parser');

const app = express();

// Sử dụng body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// URL của Supabase REST API
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Lấy API key từ biến môi trường
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: true, // Đặt thành true nếu sử dụng HTTPS với chứng chỉ hợp lệ
    timeout: 120000,
    proxyTimeout: 120000,
    pathRewrite: {
      '^/proxy': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} request to ${proxyReq.path}`);

      // Thêm header Authorization
      proxyReq.setHeader('apikey', SUPABASE_API_KEY);

      if (
        ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) &&
        req.body
      ) {
        const bodyData = JSON.stringify(req.body);

        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`Received response with status code: ${proxyRes.statusCode}`);

      let responseBody = '';
      proxyRes.on('data', (chunk) => {
        responseBody += chunk.toString();
      });
      proxyRes.on('end', () => {
        console.log('Response Body:', responseBody);
      });
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  })
);

// Endpoint kiểm tra server
app.get('/time', (req, res) => {
  const currentTime = moment()
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
