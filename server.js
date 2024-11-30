app.use(
  '/proxy',
  createProxyMiddleware({
    target: targetURL,
    changeOrigin: true,
    secure: false,  // Nếu không sử dụng HTTPS, thay thành true nếu dùng HTTPS
    pathRewrite: { '^/proxy': '' }, // Xóa tiền tố "/proxy" khỏi đường dẫn
    timeout: 120000, // Thời gian chờ cho yêu cầu đến proxy (120 giây)
    proxyTimeout: 120000, // Thời gian chờ cho phản hồi từ máy chủ đích (120 giây)

    // Xử lý yêu cầu trước khi chuyển tiếp (trong trường hợp POST/PUT/...)
    onProxyReq: (proxyReq, req, res) => {
      const apiKey = req.query.apikey;  // Nếu có query parameter 'apikey'
      if (apiKey) {
        proxyReq.setHeader('apikey', apiKey);
        console.log('API Key added to header:', apiKey);
      }

      // Log body trước khi chuyển tiếp
      console.log('Request Method:', req.method);
      console.log('Request Body:', req.body);
    },

    // Sử dụng req.pipe() để truyền tải body
    onProxyReqWs: (proxyReq, req, res) => {
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.pipe(proxyReq);  // Sử dụng pipe để truyền tải dữ liệu body
      }
    },

    // Xử lý khi xảy ra lỗi proxy
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
      });
    },

    // Xử lý phản hồi từ máy chủ đích (Supabase)
    onProxyRes: (proxyRes, req, res) => {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', () => {
        console.log('Response from Supabase:', body);
        res.status(proxyRes.statusCode).send(body);  // Gửi lại phản hồi về client
      });
    },
  })
);
