const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();
const targetURL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// **🔥 API Key cố định**
const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: targetURL,
    changeOrigin: true,
    secure: true,
    timeout: 120000,
    proxyTimeout: 120000,

    // **🔥 Xóa `/proxy` khỏi URL trước khi gửi đến Supabase**
    pathRewrite: (path, req) => {
      return path.replace(/^\/proxy/, '');
    },

    // **🔥 Thêm API Key vào request**
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('apikey', API_KEY);
      proxyReq.setHeader('Authorization', `Bearer ${API_KEY}`);

      // **🔥 Đảm bảo body được gửi đi đúng cách**
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },

    // **🔥 Xử lý lỗi proxy**
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
    },

    // **🔥 Ghi log phản hồi từ Supabase**
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
  })
);

// **🔥 Route lấy thời gian thực**
app.get('/time', (req, res) => {
  const currentTime = moment()
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

// **🔥 Chạy server**
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
