const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const url = require('url');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Middleware để đọc body request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, 
    timeout: 120000,
    proxyTimeout: 120000,

    // Rút gọn URL
   pathRewrite: (path, req) => {
  let newPath = path.replace(/^\/proxy/, ''); // Loại bỏ "/proxy"
  let queryString = req.url.split('?')[1] || ''; // Lấy query string (nếu có)

  // Chuyển đường dẫn "/proxy/userdata/2" thành "/userdata?id=eq.2"
  newPath = newPath.replace(/\/(\d+)$/, (match, id) => `?id=eq.${id}`);

  // Luôn thêm apikey, kể cả khi có query string
  return `${newPath}?${queryString ? queryString + '&' : ''}apikey=${API_KEY}`;
},

    // Thêm API Key vào Header
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('apikey', API_KEY);
      console.log(`Proxying: ${req.method} ${req.url}`);
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },

    // Log phản hồi từ Supabase
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
      });
    },

    // Xử lý lỗi proxy
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    },
  })
);

// API trả về thời gian Việt Nam
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
