# Railway 部署检查清单 - Openrice 项目

## ✅ 已完成
- [x] 在 Railway 创建项目 "Openrice"

## 📋 接下来需要完成的步骤

### 1. 连接 GitHub 仓库（如果还没连接）

在 Railway 项目页面：
1. 点击 "Settings" 标签
2. 找到 "Source" 部分
3. 点击 "Connect GitHub Repo"
4. 选择您的仓库并授权

### 2. 配置项目设置

在 Railway 项目页面：
1. 点击服务（Service）设置
2. 找到 "Root Directory" 设置
3. 设置为：`server`
4. 保存更改

### 3. 设置环境变量 ⚠️ 重要

在 Railway 项目页面：
1. 点击 "Variables" 标签
2. 添加以下环境变量：

#### 必需的环境变量：

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/openrice?retryWrites=true&w=majority
```

**获取 MongoDB Atlas 连接字符串：**
- 访问 https://www.mongodb.com/cloud/atlas
- 创建或选择集群
- 点击 "Connect" → "Connect your application"
- 复制连接字符串
- 替换 `<password>` 为您的数据库密码
- 确保 IP 白名单包含 `0.0.0.0/0`（允许所有 IP）

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**获取 OpenAI API Key：**
- 访问 https://platform.openai.com/api-keys
- 创建新的 API Key
- 复制并添加到环境变量

```
GOOGLE_MAPS_API_KEY=AIza-your-google-maps-api-key-here
```

**获取 Google Maps API Key：**
- 访问 https://console.cloud.google.com/
- 启用以下 API：
  - Places API
  - Maps JavaScript API
  - Geocoding API
- 创建 API Key
- 添加到环境变量

#### 可选的环境变量：

```
FRONTEND_URL=https://your-frontend-domain.com
```

如果您有前端部署（如 Vercel），设置此变量以配置 CORS。

**注意：** `PORT` 变量 Railway 会自动设置，不需要手动添加。

### 4. 触发部署

如果已经连接了 GitHub：
- 推送代码到 GitHub 会自动触发部署
- 或者点击 "Deploy" 按钮手动触发

### 5. 检查部署状态

1. 点击 "Deployments" 标签
2. 查看最新的部署日志
3. 等待构建完成（通常 2-5 分钟）

### 6. 获取部署 URL

部署成功后：
1. 在项目页面找到 "Domains" 部分
2. 点击 "Generate Domain" 或使用提供的默认域名
3. 复制 URL（例如：`https://openrice-production.up.railway.app`）

### 7. 测试部署

在浏览器或使用 curl 测试：

```bash
# 健康检查
curl https://your-railway-url.up.railway.app/api/health

# 应该返回：
# {"status":"OK","message":"Server is running"}
```

访问根路径：
```
https://your-railway-url.up.railway.app/
```

应该看到 API 端点信息。

## 🔍 故障排除

### 部署失败？

1. **检查构建日志**
   - 在 "Deployments" 标签查看详细日志
   - 查找错误信息

2. **常见问题：**
   - ❌ "Cannot find module" → 检查 `server/package.json` 依赖
   - ❌ "MongoDB connection error" → 检查 `MONGODB_URI` 和环境变量
   - ❌ "Port already in use" → Railway 会自动处理，无需担心

### 环境变量未生效？

1. 确保变量名完全正确（区分大小写）
2. 重新部署服务
3. 检查变量值中是否有特殊字符需要转义

### MongoDB 连接失败？

1. 检查 MongoDB Atlas IP 白名单：
   - 登录 MongoDB Atlas
   - 点击 "Network Access"
   - 添加 IP：`0.0.0.0/0`（允许所有 IP）
2. 检查连接字符串格式
3. 确保数据库用户密码正确

## 📝 下一步

部署成功后：

1. **更新前端配置**
   - 如果前端已部署，更新 `REACT_APP_API_URL` 为 Railway URL
   - 重新部署前端

2. **测试完整功能**
   - 测试搜索功能
   - 测试收藏功能
   - 检查 API 响应

3. **监控**
   - 在 Railway 查看实时日志
   - 监控资源使用情况

## 💡 提示

- Railway 提供 $5 免费额度/月
- 查看 "Metrics" 标签了解资源使用情况
- 可以设置自定义域名（在 Settings → Domains）

