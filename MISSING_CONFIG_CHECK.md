# 缺失配置检查清单

## 🔍 系统检查结果

基于代码分析，以下是所有需要的环境变量和配置项。

---

## ⚠️ 后端服务 - 必需配置

### 1. 数据库连接
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/openrice?retryWrites=true&w=majority
```
- [ ] **状态**: 必需
- [ ] **检查**: 是否已设置？
- [ ] **格式**: 必须包含数据库名称 `/openrice`

### 2. Google Maps API
```env
GOOGLE_MAPS_API_KEY=AIzaSy...
```
- [ ] **状态**: 必需
- [ ] **检查**: 是否已设置？
- [ ] **用途**: 
  - 餐厅搜索（Places API）
  - 地图显示
  - 地理位置服务

### 3. AI 提供商配置

#### 选项 A: Ollama（当前默认）
```env
AI_PROVIDER=ollama
OLLAMA_API_URL=https://your-ollama-service.up.railway.app
OLLAMA_MODEL=phi-2
```
- [ ] **AI_PROVIDER**: 是否设置为 `ollama`？
- [ ] **OLLAMA_API_URL**: 是否指向正确的 Ollama 服务 URL？
- [ ] **OLLAMA_MODEL**: 是否设置？（推荐：`phi-2` 或 `tinyllama`）

#### 选项 B: Google Gemini
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-pro
```
- [ ] **AI_PROVIDER**: 是否设置为 `gemini`？
- [ ] **GEMINI_API_KEY**: 是否已设置？
- [ ] **GEMINI_MODEL**: 可选（默认：`gemini-pro`）

#### 选项 C: OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```
- [ ] **AI_PROVIDER**: 是否设置为 `openai`？
- [ ] **OPENAI_API_KEY**: 是否已设置？
- [ ] **OPENAI_MODEL**: 可选（默认：`gpt-4o-mini`）

---

## 🔧 后端服务 - 可选配置

### CORS 配置（如果前端在不同域名）
```env
FRONTEND_URL=https://your-frontend-url.up.railway.app
```
- [ ] **状态**: 可选（但如果前端在不同域名，建议设置）
- [ ] **检查**: 如果前端和后端在不同 URL，是否已设置？
- [ ] **格式**: 可以设置多个 URL（用逗号分隔）

### 网站抓取配置（可选）
```env
ENABLE_WEBSITE_SCRAPE=true
EVIDENCE_CACHE_TTL_MS=21600000
EVIDENCE_MAX_PLACES=3
EVIDENCE_RESPECT_ROBOTS=true
EVIDENCE_MIN_DELAY_MS=1200
EVIDENCE_MAX_HTML_BYTES=1000000
EVIDENCE_ALLOWED_DOMAINS=
EVIDENCE_BLOCKED_DOMAINS=
EVIDENCE_UA=OpenRiceBot/1.0
EVIDENCE_ROBOTS_UA=openricebot
```
- [ ] **状态**: 全部可选（有默认值）
- [ ] **说明**: 这些配置用于增强 AI 解释功能（抓取餐厅网站菜单）
- [ ] **建议**: 如果不需要网站抓取，可以不设置（默认关闭）

---

## 🎨 前端服务 - 必需配置

### 1. 后端 API URL
```env
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```
- [ ] **状态**: 必需
- [ ] **检查**: 是否已设置？
- [ ] **格式**: 必须以 `REACT_APP_` 开头
- [ ] **值**: 必须包含 `https://` 前缀
- [ ] **注意**: 必须在构建时设置（不是运行时）

### 2. Google Maps API Key
```env
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSy...
```
- [ ] **状态**: 必需
- [ ] **检查**: 是否已设置？
- [ ] **格式**: 必须以 `REACT_APP_` 开头
- [ ] **用途**: 
  - 地图显示
  - 地点详情
  - 导航功能

---

## 🤖 Ollama 服务配置（如果使用 Ollama）

### 服务配置
- [ ] **Root Directory**: 是否设置为 `ollama-service`？
- [ ] **Start Command**: 是否设置为 `ollama serve`？
- [ ] **资源**: 是否至少有 4GB RAM？

### 环境变量（可选）
```env
OLLAMA_MODEL=phi-2
```
- [ ] **状态**: 可选（可以在首次请求时通过 API 下载模型）

---

## 📊 配置完整性检查

### 后端服务检查清单

#### 核心功能
- [ ] `MONGODB_URI` - ✅ 必需
- [ ] `GOOGLE_MAPS_API_KEY` - ✅ 必需
- [ ] `AI_PROVIDER` - ✅ 必需（默认：`ollama`）

#### AI 配置（根据 AI_PROVIDER）
- [ ] 如果 `AI_PROVIDER=ollama`：
  - [ ] `OLLAMA_API_URL` - ✅ 必需
  - [ ] `OLLAMA_MODEL` - ⚠️ 推荐设置
- [ ] 如果 `AI_PROVIDER=gemini`：
  - [ ] `GEMINI_API_KEY` - ✅ 必需
- [ ] 如果 `AI_PROVIDER=openai`：
  - [ ] `OPENAI_API_KEY` - ✅ 必需

#### 可选配置
- [ ] `FRONTEND_URL` - ⚠️ 如果前端在不同域名，建议设置
- [ ] `ENABLE_WEBSITE_SCRAPE` - 可选（默认：`false`）

### 前端服务检查清单

#### 核心功能
- [ ] `REACT_APP_API_URL` - ✅ 必需
- [ ] `REACT_APP_GOOGLE_MAPS_API_KEY` - ✅ 必需

### Ollama 服务检查清单（如果使用）

#### 服务配置
- [ ] Root Directory = `ollama-service`
- [ ] Start Command = `ollama serve`
- [ ] 资源充足（至少 4GB RAM）

---

## 🚨 常见缺失问题

### 问题 1: AI 功能不工作

**可能原因：**
- [ ] `AI_PROVIDER` 未设置或设置错误
- [ ] 对应的 AI 配置缺失：
  - Ollama: `OLLAMA_API_URL` 未设置
  - Gemini: `GEMINI_API_KEY` 未设置
  - OpenAI: `OPENAI_API_KEY` 未设置

**解决方案：**
1. 检查 `AI_PROVIDER` 值是否正确
2. 根据 `AI_PROVIDER` 设置对应的配置
3. 如果使用 Ollama，确保 Ollama 服务已部署并运行

### 问题 2: 前端无法连接后端

**可能原因：**
- [ ] `REACT_APP_API_URL` 未设置
- [ ] `REACT_APP_API_URL` 值错误（缺少 `https://`）
- [ ] 后端 `FRONTEND_URL` 未设置（CORS 问题）

**解决方案：**
1. 检查前端 `REACT_APP_API_URL` 是否正确
2. 检查后端 `FRONTEND_URL` 是否设置（如果前端在不同域名）
3. 重新构建前端（环境变量必须在构建时设置）

### 问题 3: 搜索功能不工作

**可能原因：**
- [ ] `GOOGLE_MAPS_API_KEY` 未设置
- [ ] `GOOGLE_MAPS_API_KEY` 无效
- [ ] Google Cloud Console 未启用必要的 API

**解决方案：**
1. 检查 `GOOGLE_MAPS_API_KEY` 是否设置
2. 验证 API Key 是否有效
3. 确保已启用以下 API：
   - Places API (New)
   - Maps JavaScript API
   - Geocoding API

### 问题 4: 数据库连接失败

**可能原因：**
- [ ] `MONGODB_URI` 未设置
- [ ] `MONGODB_URI` 格式错误
- [ ] MongoDB Atlas IP 白名单未配置

**解决方案：**
1. 检查 `MONGODB_URI` 是否正确
2. 确保包含数据库名称 `/openrice`
3. 检查 MongoDB Atlas IP 白名单（应包含 `0.0.0.0/0`）

---

## ✅ 快速验证命令

### 检查后端配置
```bash
# 健康检查
curl https://your-backend-url.up.railway.app/api/health

# 应该返回：
# {"status":"OK","message":"Server is running"}
```

### 检查 Ollama 服务（如果使用）
```bash
# 检查服务状态
curl https://your-ollama-service.up.railway.app/api/tags

# 应该返回模型列表
```

### 检查前端配置
1. 访问前端 URL
2. 打开浏览器开发者工具（F12）
3. 检查 Console 是否有错误
4. 检查 Network 标签，查看 API 请求是否成功

---

## 📝 配置优先级

### 优先级 1: 必需配置（必须设置）
1. `MONGODB_URI` - 数据库连接
2. `GOOGLE_MAPS_API_KEY` - 地图和搜索功能
3. `AI_PROVIDER` - AI 功能
4. 对应的 AI 配置（`OLLAMA_API_URL` 或 `GEMINI_API_KEY` 或 `OPENAI_API_KEY`）
5. `REACT_APP_API_URL` - 前端连接后端
6. `REACT_APP_GOOGLE_MAPS_API_KEY` - 前端地图功能

### 优先级 2: 推荐配置（建议设置）
1. `FRONTEND_URL` - 如果前端在不同域名
2. `OLLAMA_MODEL` - 如果使用 Ollama

### 优先级 3: 可选配置（有默认值）
1. 所有 `EVIDENCE_*` 配置
2. `ENABLE_WEBSITE_SCRAPE`

---

## 🎯 当前配置状态检查

请根据你的实际情况，检查以下配置：

### 后端服务 (openrice-production)

**必需配置：**
- [ ] `MONGODB_URI` = ?
- [ ] `GOOGLE_MAPS_API_KEY` = ?
- [ ] `AI_PROVIDER` = ? (应该是 `ollama`、`gemini` 或 `openai`)

**根据 AI_PROVIDER：**
- [ ] 如果 `ollama`: `OLLAMA_API_URL` = ?
- [ ] 如果 `ollama`: `OLLAMA_MODEL` = ?
- [ ] 如果 `gemini`: `GEMINI_API_KEY` = ?
- [ ] 如果 `openai`: `OPENAI_API_KEY` = ?

**推荐配置：**
- [ ] `FRONTEND_URL` = ? (如果前端在不同域名)

### 前端服务 (ideal-perception)

**必需配置：**
- [ ] `REACT_APP_API_URL` = ?
- [ ] `REACT_APP_GOOGLE_MAPS_API_KEY` = ?

### Ollama 服务（如果使用）

**服务配置：**
- [ ] Root Directory = `ollama-service`?
- [ ] Start Command = `ollama serve`?
- [ ] 资源充足（至少 4GB RAM）?

---

## 📚 相关文档

- [RAILWAY_CONFIG_CHECK.md](./RAILWAY_CONFIG_CHECK.md) - Railway 配置检查清单
- [SETUP.md](./SETUP.md) - 完整设置指南
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Railway 部署指南
- [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) - Ollama 配置指南

---

**最后更新**: 2024-01-21

