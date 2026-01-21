# Railway 前端部署配置指南

## ✅ 已完成的配置

1. ✅ 创建了 `client/nixpacks.toml` - Railway 构建配置
2. ✅ 创建了 `client/server.js` - Express 静态文件服务器
3. ✅ 更新了 `client/package.json` - 添加了 serve 脚本和依赖

## 📋 在 Railway 中配置前端服务

### 步骤 1: 创建前端服务

1. **在 Railway 项目中添加新服务**
   - 打开 Railway 项目 "Openrice"
   - 点击 "New" 或 "+" 按钮
   - 选择 "GitHub Repo"
   - 选择仓库：`Mota0308/Openrice`

2. **重命名服务（可选）**
   - 点击服务名称
   - 重命名为 "client" 或 "frontend"

### 步骤 2: 配置服务设置

在服务 Settings 中设置：

- **Root Directory**: `client`
- **Build Command**: （自动检测，应该是 `npm install && npm run build`）
- **Start Command**: `npm run serve`

### 步骤 3: 设置环境变量 ⚠️ 重要

在服务 Variables 中添加：

```
REACT_APP_API_URL=https://openrice-production.up.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
```

**重要：**
- 环境变量名称必须以 `REACT_APP_` 开头
- Railway 会在构建时自动注入这些变量
- 确保在部署前设置好这些变量

### 步骤 4: 生成域名

1. 在服务 Settings → Networking
2. 点击 "Generate Domain"
3. 获取前端 URL（例如：`https://openrice-client-xxxx.up.railway.app`）

### 步骤 5: 更新后端 CORS（如果需要）

如果前端部署到不同域名，在后端服务的 Variables 中添加：

```
FRONTEND_URL=https://your-frontend-railway-url.up.railway.app
```

## 🔍 验证部署

部署成功后：

1. **访问前端 URL**
   - 应该能看到 OpenRice 应用界面

2. **测试功能**
   - 尝试搜索餐厅
   - 检查是否正常连接到后端 API

3. **查看日志**
   - 在 Railway 中查看服务日志
   - 应该看到：`Frontend server is running on port XXXX`

## 🐛 故障排除

### 如果构建失败

1. **检查环境变量**
   - 确保 `REACT_APP_API_URL` 和 `REACT_APP_GOOGLE_MAPS_API_KEY` 都已设置
   - 变量名必须完全正确（区分大小写）

2. **检查 Root Directory**
   - 确保设置为 `client`

3. **查看构建日志**
   - 在 Railway Deployments 中查看详细错误信息

### 如果运行时错误

1. **检查服务器日志**
   - 查看是否有 Express 服务器启动错误

2. **检查端口**
   - Railway 会自动设置 PORT 环境变量
   - 确保 server.js 使用 `process.env.PORT`

## 📝 文件说明

- `client/nixpacks.toml` - Railway 构建配置
- `client/server.js` - Express 静态文件服务器
- `client/package.json` - 已添加 serve 脚本和 express 依赖

## ✅ 完成后的架构

- **后端服务**: `https://openrice-production.up.railway.app`
- **前端服务**: `https://openrice-client-xxxx.up.railway.app`（您的实际 URL）

两个服务都在同一个 Railway 项目中，便于管理！

