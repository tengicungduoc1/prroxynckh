const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Middleware thu thập raw body cho route /proxy
app.use('/proxy', (req, res, next) => {
  let data = [];
  req.on('data', chunk => data.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
});

// Proxy chuyển tiếp đến Supabase
app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false,
    timeout: 120000,
    proxyTimeout: 120000,
    // Loại bỏ tiền tố /proxy
    pathRewrite: { '^/proxy': '' },
    onProxyReq: (proxyReq, req, res) => {
      // Nếu có rawBody thì thiết lập Content-Length và ghi dữ liệu vào proxy request
      if (req.rawBody && req.rawBody.length) {
        proxyReq.setHeader('Content-Length', req.rawBody.length);
        proxyReq.write(req.rawBody);
      }
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
