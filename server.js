const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();

const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Đối với các route không phải /proxy, ta vẫn dùng express.json()
// Nhưng đối với /proxy, ta dùng express.raw() để giữ nguyên body (dù là JSON hay dữ liệu khác)
app.use((req, res, next) => {
  if (req.url.startsWith('/proxy')) {
    express.raw({ type: '*/*' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false,
    timeout: 120000,
    proxyTimeout: 120000,
    // Chỉ loại bỏ tiền tố "/proxy" để URL cuối cùng là: SUPABASE_URL + phần còn lại
    pathRewrite: { '^/proxy': '' },
    
    // Trong onProxyReq, nếu có body, chuyển tiếp body đó (đã là Buffer) cho target
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Forwarding: ${req.method} ${req.url}`);
      if (req.body && req.body.length) {
        proxyReq.setHeader('Content-Length', req.body.length);
        proxyReq.write(req.body);
        proxyReq.end();
      }
    },

    onProxyRes: (proxyRes, req, res) => {
      console.log('Response received from Supabase');
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  })
);

// Route /time để trả về thời gian theo múi giờ Việt Nam (dùng để test server)
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
