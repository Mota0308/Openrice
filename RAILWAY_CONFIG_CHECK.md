# Railway 配置检查清单

## 📋 服务配置总览

你的 Railway 项目应该包含以下服务：

1. **后端服务** (openrice-production) - Node.js API 服务器
2. **前端服务** (ideal-perception) - React 前端应用
3. **Ollama 服务** (可选) - 本地 LLM 服务（如果使用 Ollama）

---

## 🔧 后端服务配置检查

### 服务名称
- [ ] 服务名称：`openrice-production` 或类似名称

### Root Directory
- [ ] **必须设置为**：`server`
- [ ] 检查路径：Settings → Root Directory

### Build & Start 命令
- [ ] Build Command: 自动检测（使用 `nixpacks.toml`）
- [ ] Start Command: `node index.js` 或 `npm start`
- [ ] 检查路径：Settings → Deploy

### 环境变量（必需）

#### 1. 数据库连接
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/openrice?retryWrites=true&w=majority
```
- [ ] 已设置 `MONGODB_URI`
- [ ] 包含数据库名称 `/openrice`
- [ ] 密码已正确替换

#### 2. Google Maps API
```env
GOOGLE_MAPS_API_KEY=AIzaSy...
```
- [ ] 已设置 `GOOGLE_MAPS_API_KEY`
- [ ] API Key 格式正确（以 `AIzaSy` 开头）
- [ ] 已在 Google Cloud Console 启用以下 API：
  - [ ] Places API (New)
  - [ ] Maps JavaScript API
  - [ ] Geocoding API

#### 3. AI 提供商配置（三选一）

**选项 1：Ollama（推荐）**
```env
AI_PROVIDER=ollama
OLLAMA_API_URL=https://your-ollama-service.up.railway.app
OLLAMA_MODEL=phi-2
```
- [ ] 已设置 `AI_PROVIDER=ollama`
- [ ] 已设置 `OLLAMA_API_URL`（指向 Ollama 服务 URL）
- [ ] 已设置 `OLLAMA_MODEL`（推荐：`phi-2` 或 `tinyllama`）

**选项 2：Google Gemini**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-pro
```
- [ ] 已设置 `AI_PROVIDER=gemini`
- [ ] 已设置 `GEMINI_API_KEY`
- [ ] 已设置 `GEMINI_MODEL`（可选，默认：`gemini-pro`）

**选项 3：OpenAI**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```
- [ ] 已设置 `AI_PROVIDER=openai`
- [ ] 已设置 `OPENAI_API_KEY`
- [ ] 已设置 `OPENAI_MODEL`（可选，默认：`gpt-4o-mini`）

### 环境变量（可选）

#### CORS 配置
```env
FRONTEND_URL=https://your-frontend-url.up.railway.app
```
- [ ] 如果前端在不同域名，已设置 `FRONTEND_URL`
- [ ] 可以设置多个 URL（用逗号分隔）
- [ ] URL 包含 `https://` 前缀

#### 网站抓取配置（可选）
```env
ENABLE_WEBSITE_SCRAPE=true
EVIDENCE_CACHE_TTL_MS=21600000
EVIDENCE_MAX_PLACES=3
```

#### 端口（自动设置）
- [ ] `PORT` 变量由 Railway 自动设置，**不需要手动添加**

### 部署状态
- [ ] 服务已成功部署
- [ ] 部署日志无错误
- [ ] 健康检查通过：`https://your-backend-url.up.railway.app/api/health`

---

## 🎨 前端服务配置检查

### 服务名称
- [ ] 服务名称：`ideal-perception` 或类似名称

### Root Directory
- [ ] **必须设置为**：`client`
- [ ] 检查路径：Settings → Root Directory

### Build & Start 命令
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run serve`
- [ ] 检查路径：Settings → Deploy

### 环境变量（必需）

#### 1. 后端 API URL
```env
REACT_APP_API_URL=https://openrice-production.up.railway.app
```
- [ ] 已设置 `REACT_APP_API_URL`
- [ ] 值指向正确的后端 URL
- [ ] 包含 `https://` 前缀
- [ ] **变量名必须以 `REACT_APP_` 开头**

#### 2. Google Maps API Key
```env
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSy...
```
- [ ] 已设置 `REACT_APP_GOOGLE_MAPS_API_KEY`
- [ ] API Key 格式正确
- [ ] **变量名必须以 `REACT_APP_` 开头**

### 部署状态
- [ ] 服务已成功部署
- [ ] 构建日志无错误
- [ ] 前端 URL 可访问

---

## 🤖 Ollama 服务配置检查（如果使用）

### 服务名称
- [ ] 服务名称：`ollama-service` 或类似名称

### Root Directory
- [ ] **必须设置为**：`ollama-service`
- [ ] 检查路径：Settings → Root Directory

### Build & Start 命令
- [ ] Build Command: 自动检测 Dockerfile
- [ ] Start Command: `ollama serve`
- [ ] 检查路径：Settings → Deploy

### 资源要求
- [ ] **RAM**: 至少 4GB（推荐 8GB+）
- [ ] **存储**: 至少 10GB
- [ ] ⚠️ Railway 免费计划可能不足以运行 Ollama

### 环境变量（可选）
```env
OLLAMA_MODEL=phi-2
```
- [ ] 可选：设置默认模型

### 部署状态
- [ ] 服务已成功部署
- [ ] 首次部署可能需要 10-30 分钟（下载模型）
- [ ] 测试 API：`https://your-ollama-service.up.railway.app/api/tags`

---

## ✅ 配置验证清单

### 后端服务
- [ ] Root Directory = `server`
- [ ] `MONGODB_URI` 已设置且正确
- [ ] `GOOGLE_MAPS_API_KEY` 已设置
- [ ] `AI_PROVIDER` 已设置（`ollama`、`gemini` 或 `openai`）
- [ ] 对应的 AI 配置已设置（`OLLAMA_API_URL` 或 `GEMINI_API_KEY` 或 `OPENAI_API_KEY`）
- [ ] `FRONTEND_URL` 已设置（如果前端在不同域名）
- [ ] 健康检查通过：`/api/health`

### 前端服务
- [ ] Root Directory = `client`
- [ ] Start Command = `npm run serve`
- [ ] `REACT_APP_API_URL` 已设置且指向后端
- [ ] `REACT_APP_GOOGLE_MAPS_API_KEY` 已设置
- [ ] 前端 URL 可访问

### Ollama 服务（如果使用）
- [ ] Root Directory = `ollama-service`
- [ ] Start Command = `ollama serve`
- [ ] 资源充足（至少 4GB RAM）
- [ ] 后端 `OLLAMA_API_URL` 指向此服务

---

## 🔍 常见问题排查

### 问题 1: 后端 500 错误

**检查：**
1. [ ] `MONGODB_URI` 是否正确
2. [ ] `GOOGLE_MAPS_API_KEY` 是否有效
3. [ ] AI 提供商配置是否正确
4. [ ] 查看 Railway 日志获取详细错误

### 问题 2: 前端无法连接后端

**检查：**
1. [ ] `REACT_APP_API_URL` 是否正确
2. [ ] 后端 CORS 配置（`FRONTEND_URL`）
3. [ ] 后端服务是否运行正常

### 问题 3: AI 功能不工作

**如果使用 Ollama：**
1. [ ] `OLLAMA_API_URL` 是否正确
2. [ ] Ollama 服务是否运行
3. [ ] 模型是否已下载
4. [ ] 查看 Ollama 服务日志

**如果使用 Gemini：**
1. [ ] `GEMINI_API_KEY` 是否正确
2. [ ] API Key 是否有效
3. [ ] 是否超过免费额度

**如果使用 OpenAI：**
1. [ ] `OPENAI_API_KEY` 是否正确
2. [ ] API Key 是否有效
3. [ ] 账户是否有余额

### 问题 4: 构建失败

**后端：**
1. [ ] Root Directory = `server`
2. [ ] `package.json` 存在且正确
3. [ ] 查看构建日志

**前端：**
1. [ ] Root Directory = `client`
2. [ ] `REACT_APP_*` 环境变量已设置
3. [ ] 查看构建日志

---

## 📝 快速检查命令

### 检查后端健康
```bash
curl https://your-backend-url.up.railway.app/api/health
```

### 检查 Ollama 服务
```bash
curl https://your-ollama-service.up.railway.app/api/tags
```

### 测试搜索功能
访问前端网站，输入搜索查询，检查：
- [ ] 搜索结果正常显示
- [ ] AI 解说面板出现（如果配置了 AI）
- [ ] 无控制台错误

---

## 🎯 配置优先级

1. **必需配置**（必须设置）：
   - `MONGODB_URI`
   - `GOOGLE_MAPS_API_KEY`
   - `AI_PROVIDER` + 对应的 AI 配置
   - `REACT_APP_API_URL`（前端）
   - `REACT_APP_GOOGLE_MAPS_API_KEY`（前端）

2. **推荐配置**：
   - `FRONTEND_URL`（如果前端在不同域名）
   - `OLLAMA_MODEL`（如果使用 Ollama）

3. **可选配置**：
   - `ENABLE_WEBSITE_SCRAPE`
   - `EVIDENCE_CACHE_TTL_MS`
   - `EVIDENCE_MAX_PLACES`

---

## 📚 相关文档

- [SETUP.md](./SETUP.md) - 完整设置指南
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Railway 部署指南
- [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) - Ollama 配置指南
- [ollama-service/README.md](./ollama-service/README.md) - Ollama 服务详细文档

---

**最后更新**: 2024-01-21

