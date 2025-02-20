const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const url = require('url');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

// Sử dụng middleware parse JSON và URL-encoded
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

    // Loại bỏ tiền tố "/proxy" và đảm bảo API key có trong query
    pathRewrite: (path, req) => {
      // Lấy phần path mà không có tiền tố /proxy
      let newPath = path.replace(/^\/proxy/, '');
      // Lấy query từ req.url
      const parsedUrl = url.parse(req.url, true);
      const queryParams = parsedUrl.query;
      // Nếu chưa có apikey, thêm vào
      if (!queryParams.apikey) {
        queryParams.apikey = API_KEY;
      }
      // Xây dựng lại query string
      const queryString = new URLSearchParams(queryParams).toString();
      return `${newPath}?${queryString}`;
    },

    // Thiết lập header và chuyển body (nếu có) cho các request PUT/POST/PATCH
    onProxyReq: (proxyReq, req, res) => {
      // Luôn đảm bảo header apikey được thiết lập
      proxyReq.setHeader('apikey', API_KEY);
      console.log(`Proxying: ${req.method} ${req.url}`);

      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        // Không cần gọi proxyReq.end() vì http-proxy-middleware sẽ xử lý
      }
    },

    // Ghi log phản hồi từ Supabase (và chuyển phản hồi về client)
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
        // Gửi phản hồi về client nếu chưa được gửi
        if (!res.headersSent) {
          res.end(body);
        }
      });
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    },
  })
);

// Route /time để trả về thời gian theo múi giờ Việt Nam
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
