const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk'; // Thay bằng API key thực của bạn

// Middleware xử lý raw body cho các request đến /proxy
app.use('/proxy', express.raw({
  type: '*/*',
  limit: '50mb' // Tăng kích thước tối đa cho payload
}));

// Cấu hình proxy middleware
app.use('/proxy', createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true,
  secure: false,
  timeout: 180000, // Tăng timeout lên 3 phút
  proxyTimeout: 180000,
  pathRewrite: (path) => path.replace(/^\/proxy/, ''),
  
  // Thêm headers bắt buộc cho Supabase
  headers: {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json' // Set mặc định
  },

  // Xử lý body cho PUT/POST
  onProxyReq: (proxyReq, req) => {
    console.log(`Proxying ${req.method} request to: ${SUPABASE_URL}${req.path}`);
    
    if (['PUT', 'POST', 'PATCH'].includes(req.method)) {
      if (req.body && req.body.length) {
        // Giữ nguyên body gốc
        proxyReq.setHeader('Content-Length', Buffer.byteLength(req.body));
        proxyReq.write(req.body);
      }
    }
  },

  // Xử lý lỗi chi tiết
  onError: (err, req, res) => {
    console.error('Proxy Error:', {
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      headers: req.headers
    });
    res.status(504).json({
      error: 'Gateway Timeout',
      message: 'Connection to Supabase timed out'
    });
  },

  // Log response từ Supabase
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Received ${proxyRes.statusCode} from Supabase for ${req.method} ${req.path}`);
  }
}));

// Các middleware khác
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route kiểm tra thời gian
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