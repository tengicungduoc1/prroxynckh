const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

// Dành cho route /proxy, dùng express.raw để lấy raw body cho mọi content-type
app.use('/proxy', express.raw({ type: '*/*' }));

// URL của Supabase REST API
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Cấu hình proxy cho route /proxy
app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, // Đặt true nếu chứng chỉ HTTPS của target hợp lệ
    timeout: 120000,
    proxyTimeout: 120000,
    // Loại bỏ tiền tố /proxy khỏi URL
    pathRewrite: (path, req) => path.replace(/^\/proxy/, ''),
    onProxyReq: (proxyReq, req, res) => {
      // Chỉ xử lý các phương thức có body: POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && req.body.length) {
        // Đặt lại header Content-Length theo độ dài của raw body
        proxyReq.setHeader('Content-Length', req.body.length);
        // Nếu không có Content-Type, đặt mặc định là application/json
        if (!proxyReq.getHeader('Content-Type')) {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
        // Gửi raw body và kết thúc request proxy
        proxyReq.end(req.body);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
    },
  })
);

// Các route khác có thể sử dụng middleware express.json() hoặc express.urlencoded() nếu cần
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint kiểm tra server (lấy thời gian theo múi giờ Việt Nam)
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
