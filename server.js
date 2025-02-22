const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const url = require('url');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

// Nếu cần xử lý body của request, sử dụng middleware này:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, // Nếu sử dụng HTTPS thì giữ true, nếu không thì đổi thành false
    timeout: 120000,
    proxyTimeout: 120000,

    // Rút gọn URL: loại bỏ "/proxy" và tự động thêm apikey nếu chưa có
    pathRewrite: (path, req) => {
      // Loại bỏ tiền tố "/proxy"
      let newPath = path.replace(/^\/proxy/, '');
      // Lấy query string ban đầu
      const originalQuery = req.url.split('?')[1] || '';
      // Nếu chưa có apikey, tự động thêm vào query
      const newQuery = originalQuery.includes('apikey=')
        ? originalQuery
        : (originalQuery ? `${originalQuery}&apikey=${API_KEY}` : `apikey=${API_KEY}`);
      return `${newPath}?${newQuery}`;
    },

    // Xử lý yêu cầu trước khi chuyển tiếp
    onProxyReq: (proxyReq, req, res) => {
      // Phân tích query string
      const queryObject = url.parse(req.url, true).query;
      if (queryObject.apikey) {
        proxyReq.setHeader('apikey', queryObject.apikey);
        console.log('API Key added to header:', queryObject.apikey);
      }
      console.log('Request Method:', req.method);
      console.log('Request Body:', req.body);
    },

    // Xử lý cho các phương thức có body (POST, PUT, PATCH)
    onProxyReqWs: (proxyReq, req, res) => {
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.pipe(proxyReq);
      }
    },

    // Xử lý phản hồi từ Supabase
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
        res.status(proxyRes.statusCode).send(body);
      });
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

// Route lấy thời gian theo múi giờ Việt Nam và có thứ
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
