const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');  // Thêm middleware để xử lý dữ liệu JSON

const app = express();

// Đặt URL của Supabase API
const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co';  // Thay thế bằng URL của Supabase hoặc API của bạn

// Cấu hình bodyParser để đọc dữ liệu JSON trong request
app.use(bodyParser.json());

// Thiết lập proxy cho tất cả các yêu cầu
app.use('/proxy', createProxyMiddleware({
  target: targetURL,
  changeOrigin: true,  // Thay đổi origin của yêu cầu thành server đích
  secure: false,  // Bỏ qua SSL nếu gặp vấn đề với chứng chỉ
  pathRewrite: {
    '^/proxy': '',  // Xóa '/proxy' khỏi đường dẫn khi chuyển tiếp
  },
  onProxyReq: (proxyReq, req, res) => {
    const apiKey = req.query.apikey;  // Lấy API key từ query string
    if (apiKey) {
      // Thêm API key vào URL nếu có
      const url = new URL(proxyReq.url, targetURL);
      url.searchParams.set('apikey', apiKey);
      proxyReq.url = url.pathname + url.search;
    }

    // Kiểm tra và log dữ liệu JSON gửi đi
    if (req.body) {
      console.log('Dữ liệu JSON gửi đi:', req.body);
      try {
        const jsonData = req.body;
        if (jsonData.nhietdo && jsonData.anhdung) {
          console.log('Dữ liệu hợp lệ:', jsonData);
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch (e) {
        console.error('Lỗi dữ liệu:', e.message);
        res.status(400).send('Dữ liệu không hợp lệ');
        return;
      }
    }

    // Chuyển phương thức HTTP thành PATCH (hoặc PUT nếu cần)
    proxyReq.method = 'PATCH';  // Hoặc 'PUT' nếu bạn cần cập nhật dữ liệu thay vì tạo mới
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).send('Lỗi proxy: Không thể chuyển tiếp yêu cầu.');
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
