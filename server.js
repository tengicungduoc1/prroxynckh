const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const moment = require('moment-timezone');

const app = express();
const SUPABASE_URL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Mount route /proxy trước (không có middleware parse body)
app.use(
  '/proxy',
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: false,
    timeout: 120000,
    proxyTimeout: 120000,
    // Chỉ đơn giản loại bỏ tiền tố "/proxy"
    pathRewrite: { '^/proxy': '' },
    // Không cần xử lý body, để http-proxy-middleware tự chuyển stream gốc
  })
);

// Sau đó, bạn có thể mount middleware parse body cho các route khác nếu cần.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route /time để kiểm tra server
app.get('/time', (req, res) => {
  const currentTime = moment()
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
