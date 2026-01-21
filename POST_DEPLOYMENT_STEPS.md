# 部署后检查清单

## ✅ 已完成
- [x] Railway 项目 "Openrice" 已创建
- [x] 代码已推送到 GitHub
- [x] Railway 部署成功

## 📋 接下来需要完成的步骤

### 1. 获取 Railway 部署 URL

在 Railway 项目页面：
1. 点击 "Settings" 标签
2. 找到 "Domains" 部分
3. 复制您的部署 URL（例如：`https://openrice-production.up.railway.app`）

### 2. 测试 API 端点

使用浏览器或 curl 测试：

**健康检查：**
```
https://your-railway-url.up.railway.app/api/health
```

应该返回：
```json
{"status":"OK","message":"Server is running"}
```

**根路径：**
```
https://your-railway-url.up.railway.app/
```

应该返回 API 端点信息。

### 3. 验证环境变量

在 Railway 项目页面检查 "Variables" 标签，确保以下变量都已设置：

- ✅ `MONGODB_URI` - MongoDB Atlas 连接字符串
- ✅ `OPENAI_API_KEY` - OpenAI API 密钥
- ✅ `GOOGLE_MAPS_API_KEY` - Google Maps API 密钥
- ✅ `FRONTEND_URL` - 前端 URL（可选，如果已部署前端）

### 4. 测试完整功能

#### 测试搜索功能：
```bash
curl -X POST https://your-railway-url.up.railway.app/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "附近的日式餐廳",
    "location": {
      "lat": 25.0330,
      "lng": 121.5654
    }
  }'
```

#### 测试健康检查：
```bash
curl https://your-railway-url.up.railway.app/api/health
```

### 5. 配置前端（如果已部署前端）

如果您的 React 前端已部署（如 Vercel、Netlify），需要：

1. **设置环境变量：**
   ```
   REACT_APP_API_URL=https://your-railway-url.up.railway.app
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

2. **重新部署前端**以应用新的环境变量

### 6. 监控和日志

在 Railway 中：
- 查看 "Metrics" 标签了解资源使用情况
- 查看 "Deployments" 标签查看部署历史
- 查看实时日志以监控应用运行状态

### 7. 设置自定义域名（可选）

1. 在 Railway Settings → Domains
2. 点击 "Custom Domain"
3. 输入您的域名
4. 按照指示配置 DNS 记录

## 🔍 故障排除

### API 返回错误？

1. **检查 Railway 日志**
   - 在 Railway 项目页面点击 "Deployments"
   - 查看最新的部署日志
   - 查找错误信息

2. **常见问题：**
   - MongoDB 连接失败 → 检查 `MONGODB_URI` 和 IP 白名单
   - OpenAI API 错误 → 检查 `OPENAI_API_KEY` 是否有效
   - Google Maps API 错误 → 检查 `GOOGLE_MAPS_API_KEY` 和已启用的 API

### CORS 错误？

如果前端调用 API 时出现 CORS 错误：
1. 在 Railway 设置 `FRONTEND_URL` 环境变量
2. 值为您的前端域名（例如：`https://your-frontend.vercel.app`）
3. 重新部署服务

## 📝 下一步建议

1. **前端部署**
   - 将 React 前端部署到 Vercel 或 Netlify
   - 配置环境变量连接到 Railway 后端

2. **性能优化**
   - 监控 API 响应时间
   - 优化数据库查询
   - 添加缓存机制

3. **安全性**
   - 设置 API 速率限制
   - 添加请求验证
   - 保护敏感信息

4. **功能扩展**
   - 添加用户认证
   - 实现评论功能
   - 添加推荐系统

