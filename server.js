const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const url = require('url');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

// Sử dụng middleware để parse JSON và URL-encoded body
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

    // Hàm xử lý URL (pathRewrite):
    // - Nếu URL là "/proxy/table?id=eq.2": chỉ loại bỏ tiền tố "/proxy"
    // - Nếu URL là "/proxy/table/2": loại bỏ phần "/2" và tự động thêm query id=eq.2
    // - Luôn đảm bảo query parameter "apikey" có mặt
    pathRewrite: (path, req) => {
      let newPath = path;
      // Kiểm tra xem URL có dạng "/proxy/<table>/<id>" hay không
      const regex = /^\/proxy\/([^\/]+)\/(\d+)$/;
      const match = newPath.match(regex);
      if (match) {
        // match[1]: tên table, match[2]: id
        newPath = `/${match[1]}`;
        // Lấy query object từ req.url
        const parsed = url.parse(req.url, true);
        const qp = parsed.query;
        // Ghi đè hoặc thêm query id
        qp.id = `eq.${match[2]}`;
        // Đảm bảo API key có mặt
        if (!qp.apikey) {
          qp.apikey = API_KEY;
        }
        const qs = new URLSearchParams(qp).toString();
        return `${newPath}?${qs}`;
      } else {
        // Trường hợp URL không có trailing id, chỉ cần loại bỏ tiền tố "/proxy"
        newPath = newPath.replace(/^\/proxy/, '');
        const parsed = url.parse(req.url, true);
        const qp = parsed.query;
        if (!qp.apikey) {
          qp.apikey = API_KEY;
        }
        const qs = new URLSearchParams(qp).toString();
        return `${newPath}?${qs}`;
      }
    },

    // Thiết lập header và chuyển body cho các phương thức có body (PUT/POST/PATCH)
    onProxyReq: (proxyReq, req, res) => {
      // Luôn đảm bảo header "apikey" được gửi
      proxyReq.setHeader('apikey', API_KEY);
      console.log(`Proxying: ${req.method} ${req.url}`);

      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        // Không gọi proxyReq.end() vì http-proxy-middleware quản lý stream
      }
    },

    // Log và chuyển tiếp phản hồi từ Supabase về client
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
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

// Route /time trả về thời gian theo múi giờ Việt Nam
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
