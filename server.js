const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

// Áp dụng express.json() cho tất cả các route trước khi đến proxy
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// URL của Supabase REST API
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Cấu hình proxy
app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false,
    timeout: 120000,
    proxyTimeout: 120000,
    pathRewrite: {
      '^/proxy': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} request to ${proxyReq.path}`);

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const bodyData = JSON.stringify(req.body);

        // Đặt lại header Content-Length và Content-Type
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.setHeader('Content-Type', 'application/json');

        // Ghi dữ liệu body vào request proxy
        proxyReq.write(bodyData);
      }

      // Xoá header 'Transfer-Encoding' nếu có
      proxyReq.removeHeader('Transfer-Encoding');
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`Received response with status code: ${proxyRes.statusCode}`);
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
