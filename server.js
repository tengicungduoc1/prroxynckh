const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

// URL của Supabase REST API (không chèn API key tự động)
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Middleware thu thập raw body cho các request đến /proxy
// Để đảm bảo PUT/POST gửi từ client (ví dụ: module SIM) chuyển dữ liệu gốc đúng
app.use('/proxy', (req, res, next) => {
  let data = [];
  req.on('data', (chunk) => {
    data.push(chunk);
  });
  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
});

// Đăng ký proxy route trước khi các middleware khác (để không bị ảnh hưởng bởi express.json())
app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, // Nếu cần sử dụng HTTPS, có thể chuyển thành true nếu chứng chỉ hợp lệ
    timeout: 120000,
    proxyTimeout: 120000,
    // Loại bỏ tiền tố "/proxy" khỏi đường dẫn khi chuyển tiếp
    pathRewrite: (path, req) => {
      return path.replace(/^\/proxy/, '');
    },
    // Nếu có body (cho POST, PUT, PATCH) thì ghi lại dữ liệu raw vào request proxy
    onProxyReq: (proxyReq, req, res) => {
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
    // Xử lý lỗi proxy
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
    },
  })
);

// Các route khác sử dụng body parser thông thường
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint kiểm tra thời gian theo múi giờ Việt Nam (bao gồm cả thứ)
app.get('/time', (req, res) => {
  const currentTime = moment()
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

// Khởi chạy server trên cổng được cấp (Heroku hoặc 3000 nếu local)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
