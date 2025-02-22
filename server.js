const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');

const app = express();
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Dùng raw body parser cho các request đến /proxy
app.use('/proxy', bodyParser.raw({ type: '*/*' }));

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
    // Truyền body từ SIM (nếu có) vào request proxy
    onProxyReq: (proxyReq, req, res) => {
      if (req.body && req.body.length) {
        // Thiết lập lại Content-Length nếu cần
        proxyReq.setHeader('Content-Length', req.body.length);
        proxyReq.write(req.body);
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
