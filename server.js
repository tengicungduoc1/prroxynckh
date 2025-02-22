const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

// URL của Supabase REST API (không tự động thêm API key)
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Middleware thu thập raw body cho route /proxy
app.use('/proxy', (req, res, next) => {
  const data = [];
  req.on('data', (chunk) => data.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
});

// Cấu hình proxy sử dụng proxyReqPathResolver để giữ nguyên query string
app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, // Nếu target dùng HTTPS và chứng chỉ hợp lệ, có thể chuyển thành true
    timeout: 120000,
    proxyTimeout: 120000,
    // Dùng req.originalUrl để đảm bảo giữ lại query string đúng, chỉ loại bỏ tiền tố /proxy
    proxyReqPathResolver: (req) => {
      const newUrl = req.originalUrl.replace(/^\/proxy/, '');
      console.log('Resolved URL:', newUrl);
      return newUrl;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Nếu là PUT/POST/PATCH và có raw body, ghi dữ liệu đó vào request
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (req.rawBody && req.rawBody.length) {
          proxyReq.setHeader('Content-Length', req.rawBody.length);
          if (!proxyReq.getHeader('Content-Type')) {
            proxyReq.setHeader('Content-Type', 'application/json');
          }
          proxyReq.write(req.rawBody);
        }
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

// Middleware cho các route khác (nếu cần xử lý JSON từ client)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint kiểm tra thời gian theo múi giờ Việt Nam (có thứ)
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
