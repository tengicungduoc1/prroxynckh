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

    // --- Xử lý URL: ---
    // 1. Loại bỏ tiền tố "/proxy"
    // 2. Nếu URL có dạng "/table/id" (ví dụ: /userdata/2), chuyển thành "/table" và thêm query id=eq.id
    // 3. Nếu URL chỉ có query (ví dụ: /userdata?id=eq.2), giữ nguyên
    // 4. Luôn đảm bảo apikey có trong query
    pathRewrite: (path, req) => {
      // Loại bỏ "/proxy" khỏi path
      let newPath = path.replace(/^\/proxy/, '');
      
      // Phân tích req.url để lấy query parameters (dạng object)
      const parsedUrl = url.parse(req.url, true);
      const queryParams = parsedUrl.query;
      
      // Nếu newPath có dạng "/table/id" (ví dụ: /userdata/2)
      const segments = newPath.split('/');
      // segments[0] sẽ là chuỗi rỗng vì path bắt đầu bằng '/'
      if (segments.length === 3 && segments[2]) {
        const id = segments[2];
        newPath = `/${segments[1]}`; // Loại bỏ phần id khỏi URL
        // Nếu chưa có query id, thêm điều kiện id=eq.id
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

    // --- Thiết lập header và xử lý body cho các request PUT/POST/PATCH ---
    onProxyReq: (proxyReq, req, res) => {
      // Đảm bảo header apikey được set
      proxyReq.setHeader('apikey', API_KEY);
      console.log(`Proxying: ${req.method} ${req.url}`);

      // Nếu có body và phương thức là POST, PUT hoặc PATCH, chuyển body JSON sang target
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        // Không cần gọi proxyReq.end() vì http-proxy-middleware tự quản lý stream
      }
    },

    // --- Log phản hồi từ Supabase (và chuyển phản hồi về client nếu cần) ---
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
        if (!res.headersSent) {
          res.end(body);
        }
      });
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  })
);

// Route /time để trả về thời gian theo múi giờ Việt Nam
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
