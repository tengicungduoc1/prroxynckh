const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

// Sử dụng express.raw cho route /proxy để giữ nguyên dữ liệu body dưới dạng Buffer
app.use('/proxy', express.raw({ type: '*/*' }));

// URL của Supabase REST API
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, // Nếu target dùng HTTPS và chứng chỉ hợp lệ, chuyển thành true
    timeout: 120000,
    proxyTimeout: 120000,
    pathRewrite: {
      '^/proxy': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      // Log để debug: ghi ra phương thức và độ dài body nhận được
      console.log(`Proxying ${req.method} request, body length: ${req.body ? req.body.length : 0}`);
      
      // Với các phương thức có body (POST, PUT, PATCH), nếu có dữ liệu raw được đọc, ghi vào request proxy
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && req.body.length) {
        // Đặt lại header Content-Length dựa trên độ dài body
        proxyReq.setHeader('Content-Length', req.body.length);
        // Nếu không có header Content-Type, đặt mặc định là application/json
        if (!proxyReq.getHeader('Content-Type')) {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
        // Ghi dữ liệu raw body vào request proxy
        proxyReq.write(req.body);
        // Không gọi proxyReq.end() vì http-proxy-middleware sẽ tự hoàn tất request
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  })
);

// Các middleware khác (cho các route không thuộc /proxy)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint kiểm tra server: lấy thời gian theo múi giờ Việt Nam (có thứ)
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
