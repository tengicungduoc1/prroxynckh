const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');

const app = express();

// Đặt URL của Supabase
const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co';

// Middleware xử lý JSON
app.use(bodyParser.json());

// Proxy middleware
app.use(
  '/proxy',
  createProxyMiddleware({
    target: targetURL,
    changeOrigin: true,
    secure: false,
    pathRewrite: { '^/proxy': '' }, // Xóa tiền tố "/proxy" khỏi đường dẫn khi chuyển tiếp
    timeout: 20000, // Thời gian chờ cho yêu cầu đến proxy (20 giây)
    proxyTimeout: 20000, // Thời gian chờ cho phản hồi từ máy chủ đích (20 giây)
    onProxyReq: (proxyReq, req, res) => {
      // Lấy API key từ query string và thêm vào header
      const apiKey = req.query.apikey;
      if (apiKey) {
        proxyReq.setHeader('apikey', apiKey);
        console.log('API Key added to header:', apiKey);
      }

      // Gửi body nếu là POST hoặc PATCH
      if (req.body && ['POST', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
        console.log('Body sent to Supabase:', bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
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
  })
);

// Kiểm tra root endpoint
app.get('/', (req, res) => {
  res.send('Proxy server is running. Use /proxy to send requests to Supabase.');
});

// Lắng nghe trên cổng Heroku hoặc 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Proxy server is running at http://localhost:${port}`);
});