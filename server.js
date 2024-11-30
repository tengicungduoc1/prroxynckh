const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');

const app = express();

const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co';

// Middleware xử lý JSON
app.use(bodyParser.json());

// Thiết lập proxy
app.use('/proxy', createProxyMiddleware({
  target: targetURL,
  changeOrigin: true,
  secure: false,
  pathRewrite: { '^/proxy': '' },
  onProxyReq: (proxyReq, req, res) => {
    const apiKey = req.query.apikey;
    if (apiKey) {
      proxyReq.setHeader('apikey', apiKey); // Đưa apikey vào header
    }

    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      proxyReq.end();
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error details:', err.stack);
    res.status(500).send(`Proxy error: ${err.message}`);
  },
}));

// Route root
app.get('/', (req, res) => {
  res.send('Ứng dụng proxy đang chạy. Sử dụng /proxy để gửi yêu cầu đến API.');
});

// Listen trên cổng
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Proxy server đang chạy tại http://localhost:${port}`);
});
