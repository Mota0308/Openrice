# ideal-perception 项目配置检查清单

## 📋 前端服务配置检查

### 1. Railway 服务设置
- [ ] **Root Directory**: 设置为 `client`
- [ ] **Build Command**: 自动检测或手动设置为 `npm install && npm run build`
- [ ] **Start Command**: 设置为 `npm run serve`
- [ ] **服务名称**: 确认是前端服务（可以重命名为 "client" 或 "frontend"）

### 2. 环境变量设置 ⚠️ 最重要

在 ideal-perception 项目的 Variables 中，必须设置：

```
REACT_APP_API_URL=https://openrice-production.up.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
```

**检查要点：**
- [ ] `REACT_APP_API_URL` 已设置（指向后端 URL）
- [ ] `REACT_APP_GOOGLE_MAPS_API_KEY` 已设置
- [ ] 变量名完全正确（区分大小写，必须以 `REACT_APP_` 开头）
- [ ] 值没有多余的空格或引号

### 3. 域名配置
- [ ] 已生成公共域名
- [ ] 记录前端 URL（例如：`https://ideal-perception-xxxx.up.railway.app`）

### 4. 后端 CORS 配置（重要）

如果前端部署到不同域名，需要在后端服务（openrice-production）的 Variables 中添加：

```
FRONTEND_URL=https://your-frontend-railway-url.up.railway.app
```

**检查：**
- [ ] 如果前端和后端在不同域名，已设置 `FRONTEND_URL`
- [ ] `FRONTEND_URL` 值是正确的完整前端 URL（包括 https://）

## 🔍 代码配置检查

### 前端文件
- [x] `client/nixpacks.toml` - 存在且配置正确
- [x] `client/server.js` - 存在且配置正确
- [x] `client/package.json` - 包含 express 和 serve
- [x] `client/src/config/api.js` - 使用环境变量 `REACT_APP_API_URL`

### 后端文件
- [x] `server/index.js` - CORS 配置支持 `FRONTEND_URL`

## ⚠️ 常见遗漏问题

### 1. 环境变量未在构建时注入
**问题**: React 应用在构建时需要环境变量，如果构建时没有这些变量，运行时也无法使用。

**解决**: 
- 确保在 Railway Variables 中设置环境变量
- Railway 会在构建时自动注入 `REACT_APP_*` 变量

### 2. Root Directory 设置错误
**问题**: 如果 Root Directory 不是 `client`，构建会失败。

**检查**: Settings → Root Directory 应该是 `client`

### 3. Start Command 错误
**问题**: 如果 Start Command 不正确，服务无法启动。

**检查**: Start Command 应该是 `npm run serve`

### 4. CORS 错误
**问题**: 如果前端和后端在不同域名，且后端未设置 `FRONTEND_URL`，会出现 CORS 错误。

**解决**: 在后端服务添加 `FRONTEND_URL` 环境变量

## 📝 验证步骤

### 1. 检查部署日志
在 Railway → Deployments → 查看最新部署日志：

**应该看到：**
- ✅ `npm install` 成功
- ✅ `npm run build` 成功
- ✅ `Frontend server is running on port XXXX`

**不应该看到：**
- ❌ `REACT_APP_API_URL: not found`
- ❌ 构建失败
- ❌ 端口错误

### 2. 测试前端访问
访问前端 URL：
- ✅ 页面正常加载
- ✅ 没有控制台错误
- ✅ API 请求正常（检查浏览器 Network 标签）

### 3. 测试功能
- ✅ 搜索功能正常
- ✅ 地图显示正常（如果设置了 Google Maps API Key）
- ✅ 收藏功能正常

## 🐛 如果遇到问题

### 构建失败
1. 检查环境变量是否设置
2. 检查 Root Directory 是否为 `client`
3. 查看详细构建日志

### 运行时错误
1. 检查 Start Command 是否为 `npm run serve`
2. 检查 server.js 是否在 build 目录存在
3. 查看运行时日志

### CORS 错误
1. 在后端添加 `FRONTEND_URL` 环境变量
2. 确保值是完整的前端 URL
3. 重新部署后端服务

## ✅ 完整配置清单

### ideal-perception 项目（前端）
```
Root Directory: client
Build Command: npm install && npm run build
Start Command: npm run serve

环境变量:
- REACT_APP_API_URL=https://openrice-production.up.railway.app
- REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
```

### openrice-production 项目（后端）
```
环境变量:
- MONGODB_URI=...
- GOOGLE_MAPS_API_KEY=...
- OPENAI_API_KEY=...（如果使用 AI 搜索）
- FRONTEND_URL=https://your-frontend-url.up.railway.app（如果前端在不同域名）
```

## 🎯 快速检查命令

在 Railway 中验证：
1. 打开 ideal-perception 项目
2. 检查 Variables → 确认两个环境变量都存在
3. 检查 Settings → Root Directory = `client`
4. 检查 Settings → Start Command = `npm run serve`
5. 检查 Deployments → 查看最新部署状态

