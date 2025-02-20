const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Sử dụng middleware parse JSON và URL-encoded
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

    // Chỉ loại bỏ tiền tố "/proxy" và giữ nguyên phần URL sau đó
    pathRewrite: { '^/proxy': '' },

    // Xử lý request body cho PUT/POST/PATCH
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Forwarding: ${req.method} ${req.url}`);
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        // Gọi end() để kết thúc việc gửi body
        proxyReq.end();
      }
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

// Route /time để trả về thời gian theo múi giờ Việt Nam (dùng để test server)
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
