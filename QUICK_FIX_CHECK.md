# ideal-perception 快速检查指南

## ⚡ 立即检查这些项目

### 1. 环境变量（最重要！）

在 ideal-perception 项目的 Variables 中，必须有：

```
REACT_APP_API_URL=https://openrice-production.up.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
```

**如何检查：**
1. 打开 Railway → ideal-perception 项目
2. 点击 "Variables" 标签
3. 确认这两个变量存在且值正确

### 2. Root Directory

**必须设置为：** `client`

**如何检查：**
1. Settings → Root Directory
2. 应该是 `client`

### 3. Start Command

**必须设置为：** `npm run serve`

**如何检查：**
1. Settings → Start Command
2. 应该是 `npm run serve`

### 4. 后端 CORS（如果前端在不同域名）

如果前端 URL 和后端 URL 不同，在后端（openrice-production）添加：

```
FRONTEND_URL=https://your-ideal-perception-url.up.railway.app
```

## 🔍 常见问题

### 问题 1: "REACT_APP_API_URL: not found"
**原因**: 环境变量未设置或名称错误
**解决**: 在 Variables 中添加 `REACT_APP_API_URL`

### 问题 2: 构建失败
**原因**: Root Directory 错误
**解决**: 设置为 `client`

### 问题 3: 服务无法启动
**原因**: Start Command 错误
**解决**: 设置为 `npm run serve`

### 问题 4: CORS 错误
**原因**: 后端未设置 FRONTEND_URL
**解决**: 在后端添加 FRONTEND_URL 环境变量

## ✅ 验证清单

- [ ] 环境变量 `REACT_APP_API_URL` 已设置
- [ ] 环境变量 `REACT_APP_GOOGLE_MAPS_API_KEY` 已设置
- [ ] Root Directory = `client`
- [ ] Start Command = `npm run serve`
- [ ] 部署成功（查看 Deployments）
- [ ] 前端 URL 可访问
- [ ] 后端 CORS 已配置（如果前端在不同域名）

