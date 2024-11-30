const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co'; // Thay bằng URL của Supabase hoặc máy chủ đích

app.use(express.json());  // Để có thể đọc body JSON trong các POST/PUT

app.use(
  '/proxy',
  createProxyMiddleware({
    target: targetURL,
    changeOrigin: true,
    secure: false,  // Nếu không sử dụng HTTPS, thay thành true nếu dùng HTTPS
    pathRewrite: { '^/proxy': '' }, // Xóa tiền tố "/proxy" khỏi đường dẫn
    timeout: 120000, // Thời gian chờ cho yêu cầu đến proxy (120 giây)
    proxyTimeout: 120000, // Thời gian chờ cho phản hồi từ máy chủ đích (120 giây)

    // Xử lý yêu cầu trước khi chuyển tiếp (trong trường hợp POST/PUT/...)
    onProxyReq: (proxyReq, req, res) => {
      const apiKey = req.query.apikey;  // Nếu có query parameter 'apikey'
      if (apiKey) {
        proxyReq.setHeader('apikey', apiKey);
        console.log('API Key added to header:', apiKey);
      }

      // Xử lý body cho POST, PUT, PATCH
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        console.log('Body Data:', bodyData);  // Log dữ liệu body
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();  // Đảm bảo kết thúc yêu cầu sau khi viết body
      }
    },

    // Xử lý khi xảy ra lỗi proxy
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
    },

    // Xử lý phản hồi từ máy chủ đích (Supabase)
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
        res.status(proxyRes.statusCode).send(body);  // Gửi lại phản hồi về client
      });
    },
  })
);

// Lắng nghe server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
