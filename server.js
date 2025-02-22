const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

// Áp dụng express.json() và express.urlencoded() cho tất cả các route
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// URL của Supabase REST API
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, // Đặt thành true nếu sử dụng HTTPS với chứng chỉ hợp lệ
    timeout: 120000,
    proxyTimeout: 120000,
    pathRewrite: {
      '^/proxy': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} request to ${proxyReq.path}`);

      if (
        ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) &&
        req.body
      ) {
        // Chuyển đổi body thành chuỗi JSON
        const bodyData = JSON.stringify(req.body);

        // Cập nhật header 'Content-Type' và 'Content-Length'
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

        // Ghi dữ liệu body vào proxyReq
        proxyReq.write(bodyData);
      }
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

// Endpoint kiểm tra server: lấy thời gian theo múi giờ Việt Nam
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
