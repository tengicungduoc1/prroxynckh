const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// �?t URL c?a Supabase API (ho?c URL m� b?n mu?n proxy)
const targetURL = 'https://rixclyagnxfhpxnpdhqu.supabase.co';  // Thay th? b?ng URL c?a Supabase ho?c API c?a b?n

// Thi?t l?p proxy cho t?t c? c�c y�u c?u
app.use('/proxy', createProxyMiddleware({
  target: targetURL,
  changeOrigin: true, // Thay �?i origin c?a y�u c?u th�nh server ��ch
  secure: false, // B? qua SSL (n?u c� v?n �? v?i ch?ng ch?)
  pathRewrite: {
    '^/proxy': '',  // T�ch '/proxy' kh?i ��?ng d?n
  },
  onProxyReq: (proxyReq, req, res) => {
    // Th�m API key v�o header (n?u c?n)
    proxyReq.setHeader('Authorization', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGNseWFnbnhmaHB4bnBkaHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM3NzE3MywiZXhwIjoyMDQ3OTUzMTczfQ.NuH6Ith4qM-LUEHVbska9EbRw6iVwgYFKl-Gdg1sgwA'); // Thay 'your_api_key_here' b?ng API key th?c t?
  }
}));

// L?ng nghe tr�n c?ng 3000
app.listen(4000, () => {
  console.log('Proxy server �ang ch?y t?i http://localhost:3000');
});