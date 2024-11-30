const express = require('express'); // Import thư viện express
const { createProxyMiddleware } = require('http-proxy-middleware'); // Import http-proxy-middleware
const bodyParser = require('body-parser'); // Dùng để parse body request nếu cần

const app = express(); // Khởi tạo app từ express

// Middleware để parse JSON body
app.use(bodyParser.json());

// URL đích của proxy (Supabase API URL của bạn)
const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co'; 

// Cấu hình proxy
app.use(
  '/proxy',
  createProxyMiddleware({
    target: targetURL,
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/proxy': '' }, // Xóa tiền tố "/proxy" khỏi đường dẫn
    timeout: 60000, // Thời gian chờ cho yêu cầu đến proxy
    proxyTimeout: 60000, // Thời gian chờ cho phản hồi từ máy chủ đích
    onProxyReq: (proxyReq, req, res) => {
      // Thêm API key vào header nếu có
      const apiKey = req.query.apikey;
      if (apiKey) {
        proxyReq.setHeader('apikey', apiKey);
        console.log('API Key added to header:', apiKey);
      }

      // Gửi body nếu là POST hoặc PATCH
      if (req.body && ['POST', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        console.log('Body Data:', bodyData); // Log body data trước khi gửi
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      proxyReq.end(); // Đảm bảo kết thúc request
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
        console.log('Response from Target Server:', body);
      });
    },
  })
);

// Lắng nghe cổng từ Heroku hoặc mặc định 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
