const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Đặt URL của Supabase API (hoặc URL mà bạn muốn proxy)
const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co';  // Thay thế bằng URL của Supabase hoặc API của bạn

// Thiết lập proxy cho tất cả các yêu cầu
app.use('/proxy', createProxyMiddleware({
  target: targetURL,
  changeOrigin: true, // Thay đổi origin của yêu cầu thành server đích
  secure: false, // Bỏ qua SSL (nếu có vấn đề với chứng chỉ)
  pathRewrite: {
    '^/proxy': '',  // Tách '/proxy' khỏi đường dẫn
  },
  onProxyReq: (proxyReq, req, res) => {
    // Thêm API key vào header (nếu cần)
    proxyReq.setHeader('Authorization', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGNseWFnbnhmaHB4bnBkaHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM3NzE3MywiZXhwIjoyMDQ3OTUzMTczfQ.NuH6Ith4qM-LUEHVbska9EbRw6iVwgYFKl-Gdg1sgwA'); // Thay 'your_api_key_here' bằng API key thực tế
  }
}));

// Lắng nghe trên cổng do Heroku cấp phát
const port = process.env.PORT || 5000; // Heroku sử dụng cổng động thông qua biến môi trường
app.listen(port, () => {
  console.log(`Proxy server đang chạy tại http://localhost:${port}`);
});
