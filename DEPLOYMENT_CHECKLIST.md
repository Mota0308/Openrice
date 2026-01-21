# 部署检查清单

## ✅ 代码配置检查

### 前端配置
- [x] `client/nixpacks.toml` - Railway 构建配置正确
- [x] `client/server.js` - Express 静态文件服务器已创建
- [x] `client/package.json` - 包含 express 和 serve 依赖
- [x] `client/package.json` - 包含 serve 脚本
- [x] `client/src/config/api.js` - 正确使用 `REACT_APP_API_URL`
- [x] `client/src/pages/RestaurantDetail.js` - 正确使用 `REACT_APP_GOOGLE_MAPS_API_KEY`
- [x] 无 linter 错误

### 后端配置
- [x] `server/index.js` - MongoDB 连接已修复（移除已弃用选项）
- [x] `server/index.js` - CORS 配置正确
- [x] `server/index.js` - 监听 0.0.0.0（Railway 要求）

## 📋 Railway 配置检查

### 后端服务（openrice-production）
- [x] Root Directory: `server`
- [x] 环境变量：
  - [x] `MONGODB_URI` = `mongodb+srv://chenyaolin0308:9GUhZvnuEpAA1r6c@cluster0.0dhi0qc.mongodb.net/openrice?retryWrites=true&w=majority&appName=Cluster0`
  - [ ] `OPENAI_API_KEY` = （需要设置）
  - [x] `GOOGLE_MAPS_API_KEY` = `AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY`
  - [ ] `FRONTEND_URL` = （可选，如果前端部署到不同域名）
- [x] URL: `https://openrice-production.up.railway.app`
- [x] 部署状态：正常运行

### 前端服务（需要创建）
- [ ] 服务已创建
- [ ] Root Directory: `client`
- [ ] Build Command: （自动检测）
- [ ] Start Command: `npm run serve`
- [ ] 环境变量：
  - [ ] `REACT_APP_API_URL` = `https://openrice-production.up.railway.app`
  - [ ] `REACT_APP_GOOGLE_MAPS_API_KEY` = `AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY`
- [ ] 域名已生成

## 🔍 功能测试

### 后端 API 测试
- [x] 健康检查：`/api/health` ✅
- [x] 根路径：`/` ✅
- [ ] 搜索功能：`POST /api/search` （需要 OPENAI_API_KEY）
- [ ] 餐厅详情：`GET /api/restaurants/:id`
- [ ] 收藏功能：`POST /api/restaurants/favorite`

### 前端测试（部署后）
- [ ] 页面加载正常
- [ ] 搜索功能正常
- [ ] 地图显示正常
- [ ] API 连接正常

## ⚠️ 待完成事项

### 必需
1. **设置 OPENAI_API_KEY**
   - 在 Railway 后端服务的 Variables 中添加
   - 获取方式：https://platform.openai.com/api-keys

2. **创建前端服务**
   - 在 Railway 项目中添加新服务
   - 连接到同一个 GitHub 仓库
   - 设置 Root Directory 为 `client`

3. **设置前端环境变量**
   - `REACT_APP_API_URL`
   - `REACT_APP_GOOGLE_MAPS_API_KEY`

### 可选
1. **设置 FRONTEND_URL**（如果前端部署到不同域名）
2. **测试完整功能流程**
3. **设置自定义域名**

## 📝 快速设置命令

### 在 Railway 中设置环境变量

**后端服务：**
```
MONGODB_URI=mongodb+srv://chenyaolin0308:9GUhZvnuEpAA1r6c@cluster0.0dhi0qc.mongodb.net/openrice?retryWrites=true&w=majority&appName=Cluster0
GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
OPENAI_API_KEY=sk-...（需要获取）
```

**前端服务：**
```
REACT_APP_API_URL=https://openrice-production.up.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
```

## ✅ 当前状态总结

- ✅ 后端代码配置正确
- ✅ 前端代码配置正确
- ✅ MongoDB 连接成功
- ✅ 后端 API 正常运行
- ⏳ 前端服务待创建和部署
- ⏳ OPENAI_API_KEY 待设置

## 🎯 下一步

1. 在 Railway 中创建前端服务
2. 设置前端环境变量
3. 获取并设置 OPENAI_API_KEY
4. 测试完整功能

