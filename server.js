const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();

// Middleware thu thập raw body cho route /proxy
app.use('/proxy', (req, res, next) => {
  let data = [];
  req.on('data', chunk => data.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
});

// URL của Supabase REST API (hãy thay "your_table_name" thành tên bảng thực của bạn)
const targetURL = 'https://hyctwifnimvyeirdwzsb.supabase.co/rest/v1';

// Cấu hình proxy cho tất cả các request đến /proxy
app.use('/proxy', createProxyMiddleware({
  target: targetURL,
  changeOrigin: true,
  secure: false, // Nếu cần bỏ qua SSL
  pathRewrite: { '^/proxy': '' }, // Loại bỏ tiền tố /proxy
  onProxyReq: (proxyReq, req, res) => {
    // Lấy API key từ query string nếu có (ví dụ: /proxy?apikey=your_api_key)
    const apiKey = req.query.apikey;
    if (apiKey) {
      proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
    }
    // Nếu phương thức là POST, PUT hoặc PATCH và có dữ liệu body, ghi raw body vào proxy request
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.rawBody && req.rawBody.length > 0) {
      proxyReq.setHeader('Content-Length', req.rawBody.length);
      // Nếu chưa có header Content-Type, ta đặt mặc định là application/json
      if (!proxyReq.getHeader('Content-Type')) {
        proxyReq.setHeader('Content-Type', 'application/json');
      }
      proxyReq.write(req.rawBody);
      proxyReq.end();
    }
  },
  onError: (err, req, res) => {
    res.status(500).send('Proxy error: ' + err.message);
  }
}));

// Để xử lý JSON cho các endpoint khác (ví dụ: /send-to-supabase)
app.use(express.json());

// Endpoint gửi dữ liệu trực tiếp lên Supabase qua axios
app.post('/send-to-supabase', async (req, res) => {
  const data = req.body; // Dữ liệu JSON được parse từ request body
  try {
    const response = await axios.post(targetURL, data, {
      headers: {
        'Authorization': `Bearer your_api_key_here`, // Thay bằng API key thực của bạn
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error sending data to Supabase:', error.message);
    res.status(500).json({ error: 'Có lỗi xảy ra khi gửi dữ liệu lên Supabase' });
  }
});

// Lắng nghe trên cổng được cấp (Heroku hoặc cổng mặc định 5000)
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Proxy server đang chạy tại http://localhost:${port}`);
});


// Route kiểm tra thời gian server
app.get('/time', (req, res) => {
  const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss dddd');
  res.json({ time: currentTime });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
