const express = require('express');
const path = require('path');
const app = express();

// 服务静态文件
app.use(express.static(path.join(__dirname, 'build')));

// 处理 React Router，所有路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server is running on port ${PORT}`);
});

