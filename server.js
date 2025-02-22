const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const url = require('url');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false, // Nếu sử dụng HTTPS thì giữ true; nếu không, có thể set false
    timeout: 120000,
    proxyTimeout: 120000,
    // Xây dựng lại đường dẫn cho proxy
    proxyReqPathResolver: function (req) {
      // Phân tích URL ban đầu (vd: /proxy/userdata?id=eq.2)
      const parsedUrl = url.parse(req.url, true);
      // Loại bỏ tiền tố "/proxy" từ pathname
      const newPath = parsedUrl.pathname.replace(/^\/proxy/, '');
      // Nếu query chưa có apikey, thêm vào
      if (!parsedUrl.query.apikey) {
        parsedUrl.query.apikey = API_KEY;
      }
      // Xây dựng lại query string đảm bảo đúng định dạng
      const queryStr = new URLSearchParams(parsedUrl.query).toString();
      const finalPath = newPath + (queryStr ? '?' + queryStr : '');
      console.log('Rewritten proxy path:', finalPath);
      return finalPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Cũng thêm API key vào header (nếu cần)
      proxyReq.setHeader('Authorization', `Bearer ${API_KEY}`);
      console.log('Request Method:', req.method);
      console.log('Request Body:', req.body);
    },
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
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
    },
  })
);

// Route để lấy thời gian theo múi giờ Việt Nam (có thứ)
app.get('/time', (req, res) => {
  const currentTime = moment()
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
