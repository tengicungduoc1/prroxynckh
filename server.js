const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();
// Đổi target thành URL Heroku của bạn
const TARGET_URL = 'https://glacial-tundra-54650-2a58814ae398.herokuapp.com';

// Middleware thu thập raw body cho route /proxy
app.use('/proxy', (req, res, next) => {
  let data = [];
  req.on('data', chunk => data.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
});

app.use(
  '/proxy',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    secure: true, // Vì Heroku có chứng chỉ hợp lệ
    timeout: 120000,
    proxyTimeout: 120000,
    // Loại bỏ tiền tố /proxy
    pathRewrite: { '^/proxy': '' },
    onProxyReq: (proxyReq, req, res) => {
      // Chỉ xử lý nếu phương thức là PUT, POST hoặc PATCH và có dữ liệu body
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.rawBody && req.rawBody.length > 0) {
        proxyReq.setHeader('Content-Length', req.rawBody.length);
        // Nếu chưa có header Content-Type, có thể set lại nếu cần
        if (!proxyReq.getHeader('Content-Type')) {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
        proxyReq.write(req.rawBody);
        proxyReq.end(); // Kết thúc request sau khi ghi body
      }
    },
    onError: (err, req, res) => {
      res.status(500).send('Proxy error: ' + err.message);
    },
  })
);

// Các middleware khác cho các route không liên quan đến /proxy
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route kiểm tra thời gian server
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
