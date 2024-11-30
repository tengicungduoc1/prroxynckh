const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Ð?t URL c?a Supabase API (ho?c URL mà b?n mu?n proxy)
const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co';  // Thay th? b?ng URL c?a Supabase ho?c API c?a b?n

// Thi?t l?p proxy cho t?t c? các yêu c?u
app.use('/proxy', createProxyMiddleware({
  target: targetURL,
  changeOrigin: true, // Thay ð?i origin c?a yêu c?u thành server ðích
  secure: false, // B? qua SSL (n?u có v?n ð? v?i ch?ng ch?)
  pathRewrite: {
    '^/proxy': '',  // Tách '/proxy' kh?i ðý?ng d?n
  },
  onProxyReq: (proxyReq, req, res) => {
    // Thêm API key vào header (n?u c?n)
    proxyReq.setHeader('Authorization', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGNseWFnbnhmaHB4bnBkaHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM3NzE3MywiZXhwIjoyMDQ3OTUzMTczfQ.NuH6Ith4qM-LUEHVbska9EbRw6iVwgYFKl-Gdg1sgwA'); // Thay 'your_api_key_here' b?ng API key th?c t?
  }
}));

// L?ng nghe trên c?ng 3000
app.listen(4000, () => {
  console.log('Proxy server ðang ch?y t?i http://localhost:3000');
});