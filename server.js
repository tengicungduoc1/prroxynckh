  const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');
const querystring = require('querystring');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';
const API_KEY = 'eyJhbGci...'; // Giữ nguyên API key của bạn

// Middleware chỉ parse body cho các route không phải proxy
app.use('/proxy', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false,
    timeout: 30000, // Tăng timeout lên 30s
    proxyTimeout: 30000,
    
    pathRewrite: (path, req) => {
      const newPath = path.replace(/^\/proxy/, '');
      const parsed = new URL(newPath, SUPABASE_URL);
      
      // Thêm API key nếu chưa có
      if (!parsed.searchParams.has('apikey')) {
        parsed.searchParams.append('apikey', API_KEY);
      }
      
      return parsed.pathname + parsed.search;
    },

    onProxyReq: (proxyReq, req) => {
      // Xử lý body cho PUT/PATCH/POST
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const body = req.body;
        
        if (body) {
          const contentType = proxyReq.getHeader('Content-Type');
          let bodyData;
          
          if (contentType === 'application/json') {
            bodyData = JSON.stringify(body);
          } else if (contentType === 'application/x-www-form-urlencoded') {
            bodyData = querystring.stringify(body);
          } else {
            bodyData = body.toString();
          }
          
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    },

    onProxyRes: (proxyRes, req, res) => {
      proxyRes.on('data', (chunk) => {
        console.log('Response chunk:', chunk.toString());
      });
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(502).json({ error: 'Bad Gateway' });
    }
  })
);

// Route thời gian
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});