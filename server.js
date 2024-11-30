app.use(
  '/proxy',
  createProxyMiddleware({
    target: targetURL,
    changeOrigin: true,
    secure: false,
    pathRewrite: { '^/proxy': '' }, // Xóa tiền tố "/proxy" khỏi đường dẫn khi chuyển tiếp
    timeout: 60000, // Thời gian chờ cho yêu cầu đến proxy (60 giây)
    proxyTimeout: 60000, // Thời gian chờ cho phản hồi từ máy chủ đích (60 giây)
    onProxyReq: (proxyReq, req, res) => {
      const apiKey = req.query.apikey;
      if (apiKey) {
        proxyReq.setHeader('apikey', apiKey);
        console.log('API Key added to header:', apiKey);
      }

      if (req.body && ['POST', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        console.log('Body Data:', bodyData); // Log body data before sending
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      proxyReq.end(); // Ensure we end the request properly
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
      });
    },
  })
);
