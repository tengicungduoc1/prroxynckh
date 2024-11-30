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
    '^/proxy': '',  // Xóa '/proxy' khỏi đường dẫn khi chuyển tiếp
  },
  onProxyReq: (proxyReq, req, res) => {
    // Chuyển tiếp yêu cầu và giữ nguyên API key trong URL
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGNseWFnbnhmaHB4bnBkaHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM3NzE3MywiZXhwIjoyMDQ3OTUzMTczfQ.NuH6Ith4qM-LUEHVbska9EbRw6iVwgYFKl-Gdg1sgwA'; // API key thực tế
    
    // Thêm API key vào đường dẫn của yêu cầu
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}?apikey=${apiKey}`;
    proxyReq.url = fullUrl;
  }
}));

// Xử lý yêu cầu đến root (/) của ứng dụng
app.get('/', (req, res) => {
  res.send('Ứng dụng proxy đang chạy. Sử dụng /proxy để gửi yêu cầu đến API.');
});

// Lắng nghe trên cổng Heroku
const port = process.env.PORT || 5000; // Sử dụng cổng Heroku cấp phát hoặc cổng mặc định 5000
app.listen(port, () => {
  console.log(`Proxy server đang chạy tại http://localhost:${port}`);
});
