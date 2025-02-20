const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const url = require('url');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

// Middleware để parse JSON và URL-encoded body
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

    // Path rewrite:
    // - Loại bỏ tiền tố "/proxy"
    // - Nếu URL có dạng "/proxy/table/2", chuyển thành "/table?id=eq.2"
    // - Nếu URL chỉ có query string (ví dụ: /proxy/userdata?id=eq.2), giữ nguyên
    // - Luôn đảm bảo apikey có trong query
    pathRewrite: (path, req) => {
      // Loại bỏ "/proxy" khỏi path
      let newPath = path.replace(/^\/proxy/, '');
      // Phân tích req.url để lấy query dưới dạng object
      const parsedUrl = url.parse(req.url, true);
      const queryParams = parsedUrl.query;

      // Nếu path có dạng "/table/number" (ví dụ: /userdata/2)
      const match = newPath.match(/^\/([^\/]+)\/(\d+)$/);
      if (match) {
        const table = match[1];
        const id = match[2];
        newPath = `/${table}`; // Giữ lại phần table
        // Nếu query chưa có id, thêm id từ path vào query
        if (!queryParams.id) {
          queryParams.id = `eq.${id}`;
        }
      }
      
      // Luôn đảm bảo có apikey trong query
      if (!queryParams.apikey) {
        queryParams.apikey = API_KEY;
      }
      
      // Xây dựng lại query string
      const queryString = new URLSearchParams(queryParams).toString();
      return `${newPath}?${queryString}`;
    },

    // Thiết lập header và chuyển tiếp body cho các phương thức có body
    onProxyReq: (proxyReq, req, res) => {
      // Đảm bảo header apikey luôn được set
      proxyReq.setHeader('apikey', API_KEY);
      console.log(`Proxying: ${req.method} ${req.url}`);

      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        // Không cần gọi proxyReq.end() vì http-proxy-middleware xử lý việc đó
      }
    },

    // Ghi log phản hồi từ Supabase (và chuyển phản hồi về client nếu cần)
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
        // Nếu phản hồi chưa được gửi, gửi về client
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
