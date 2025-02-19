const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();
const targetURL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/proxy',
  createProxyMiddleware({
    target: targetURL,
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/proxy': '' },
    timeout: 120000,
    proxyTimeout: 120000,

    onProxyReq: (proxyReq, req, res) => {
      const apiKey =
        req.query.apikey ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3R3aWZuaW12eWVpcmR3enNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MTg3MDAsImV4cCI6MjA0Nzk5NDcwMH0.XOwNF1zwcxpQMOk28CWWbBdz9U_DK1htKw5QbeKtgsk';

      if (apiKey) {
        proxyReq.setHeader('apikey', apiKey);
      }

      // Đảm bảo truyền dữ liệu body chính xác
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    },

    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
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
  })
);

app.get('/time', (req, res) => {
  const currentTime = moment()
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
